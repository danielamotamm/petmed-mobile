import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { startOAuthLogin } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const colors = useColors();
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const login = async () => {
    setError("");
    setStarting(true);
    try {
      await startOAuthLogin();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o login.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <IconSymbol name="pawprint.fill" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PETMED</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Cuidado no horário certo</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Entre para sincronizar pets, tratamentos e o histórico de doses em todos os seus dispositivos.
        </Text>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar na sua conta"
          disabled={starting}
          onPress={() => void login()}
          style={({ pressed }) => [styles.login, { backgroundColor: colors.primary, opacity: starting ? 0.6 : 1 }, pressed && styles.pressed]}
        >
          <Text style={styles.loginText}>{starting ? "ABRINDO..." : "ENTRAR"}</Text>
        </Pressable>
        <Text style={[styles.footer, { color: colors.muted }]}>Siga sempre a orientação veterinária para tratamentos e dosagens.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, justifyContent: "center" },
  badge: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 30, fontWeight: "700", marginTop: 6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  error: { marginTop: 16 },
  login: { minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 28 },
  loginText: { color: "#FFF", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  footer: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 28 },
  pressed: { opacity: 0.8 },
});
