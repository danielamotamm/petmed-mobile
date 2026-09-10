import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter(); const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>(); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const complete = async () => {
      try {
        if (params.error) throw new Error("O provedor recusou a autenticação.");
        const url = params.code && params.state ? null : await Linking.getInitialURL();
        const values = url ? new URL(url).searchParams : null;
        const code = params.code ?? values?.get("code"); const state = params.state ?? values?.get("state");
        if (!code || !state) throw new Error("Resposta de autenticação inválida.");
        if (Platform.OS !== "web") {
          const expectedState = await SecureStore.getItemAsync("oauth-state");
          await SecureStore.deleteItemAsync("oauth-state");
          if (!expectedState || expectedState !== state) throw new Error("Resposta de autenticação inválida.");
        }
        const result = await Api.exchangeOAuthCode(code, state);
        if (!result.sessionToken || !result.user) throw new Error("Não foi possível estabelecer a sessão.");
        await Auth.setSessionToken(result.sessionToken);
        const user = result.user as Omit<Auth.User, "lastSignedIn"> & { lastSignedIn: string };
        await Auth.setUserInfo({ ...user, lastSignedIn: new Date(user.lastSignedIn) });
        // The AuthGate redirects to the tabs once the session is available;
        // using replace keeps the callback out of the history stack.
        if (active) router.replace("/(tabs)");
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Falha ao concluir autenticação."); }
    };
    void complete(); return () => { active = false; };
  }, [params.code, params.error, params.state, router]);
  return <SafeAreaView className="flex-1"><ThemedView className="flex-1 items-center justify-center gap-4 p-5"><ActivityIndicator size="large" /><Text className="text-base text-center text-foreground">{error ?? "Concluindo autenticação..."}</Text></ThemedView></SafeAreaView>;
}
