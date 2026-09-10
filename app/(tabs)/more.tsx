import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function MoreScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();

  const signOut = async () => {
    await logout();
    await utils.invalidate();
  };

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>CONFIGURAÇÕES</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Mais</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.foreground }]}>{user.name || "Conta PetMed"}</Text>
          <Text style={{ color: colors.muted }}>{user.email || "Conta sincronizada"}</Text>
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={{ color: colors.error, fontWeight: "700" }}>SAIR DA CONTA</Text>
          </Pressable>
        </View>
        <View style={[styles.tip, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>Cuidado que acompanha</Text>
          <Text style={{ color: colors.muted }}>Siga sempre a orientação veterinária para tratamentos e dosagens.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700", marginTop: 5, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 5 },
  name: { fontSize: 17, fontWeight: "700" },
  button: { marginTop: 12, minHeight: 44, justifyContent: "center" },
  tip: { marginTop: 18, borderRadius: 16, padding: 16, gap: 5 },
  tipTitle: { fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
