import { useEffect, useState } from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { resyncDoseReminders } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(new Date());
}
function time(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(value);
}

export default function HomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const input = { date: currentDate(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  const dosesQuery = trpc.petmed.doses.today.useQuery(input, { enabled: Boolean(user) });
  const administer = trpc.petmed.doses.administer.useMutation({
    onSuccess: () => void utils.petmed.doses.today.invalidate(input),
  });
  const [selected, setSelected] = useState<number | null>(null);
  const doses = dosesQuery.data ?? [];
  const next = doses.find((dose) => dose.status === "pending");
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  // Re-sync local dose reminders whenever the schedule is shown.
  useEffect(() => {
    if (dosesQuery.data) void resyncDoseReminders();
  }, [dosesQuery.data]);

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <FlatList
        data={doses}
        keyExtractor={(item) => String(item.id)}
        refreshing={dosesQuery.isRefetching}
        onRefresh={() => void dosesQuery.refetch()}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhuma dose agendada para hoje.</Text>}
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>PETMED</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Olá, {user.name?.split(" ")[0] || "cuidador"}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{dateLabel}</Text>
            {next && (
              <View style={[styles.next, { backgroundColor: colors.primary }]}>
                <Text style={styles.nextLabel}>PRÓXIMA DOSE</Text>
                <Text style={styles.nextTime}>{time(next.scheduledAt)}</Text>
                <Text style={styles.nextText}>{next.pet.name} · {next.treatment.name} · {next.treatment.dose} {next.treatment.unit}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Dar ${next.treatment.name} agora`} onPress={() => setSelected(next.id)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  <Text style={[styles.actionText, { color: colors.primary }]}>DAR AGORA</Text>
                </Pressable>
              </View>
            )}
            <Text style={[styles.section, { color: colors.foreground }]}>Agenda de hoje</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.doseTime, { color: colors.foreground }]}>{time(item.scheduledAt)}</Text>
              <Text style={[styles.status, { color: item.status === "administered" ? colors.success : colors.muted }]}>
                {item.status === "administered" ? "Administrada" : "Pendente"}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.treatment.name}</Text>
              <Text style={{ color: colors.muted }}>{item.pet.name} · {item.treatment.dose} {item.treatment.unit}</Text>
            </View>
            {item.status === "pending" && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Administrar ${item.treatment.name} para ${item.pet.name}`} onPress={() => setSelected(item.id)}>
                <IconSymbol name="checkmark.circle.fill" size={26} color={colors.primary} />
              </Pressable>
            )}
          </View>
        )}
      />
      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Confirmar administração?</Text>
            <Pressable
              accessibilityRole="button"
              disabled={administer.isPending}
              onPress={() =>
                selected &&
                administer.mutate({ id: selected }, {
                  onSuccess: () => {
                    setSelected(null);
                    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  },
                })
              }
              style={({ pressed }) => [styles.confirm, { backgroundColor: colors.primary, opacity: administer.isPending ? 0.6 : 1 }, pressed && styles.pressed]}
            >
              <Text style={styles.confirmText}>{administer.isPending ? "REGISTRANDO..." : "CONFIRMAR"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
              <Text style={{ color: colors.primary }}>CANCELAR</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700", marginTop: 5 },
  subtitle: { fontSize: 14, marginTop: 3, textTransform: "capitalize" },
  next: { borderRadius: 18, padding: 18, marginTop: 22, marginBottom: 24 },
  nextLabel: { color: "#D4EBE5", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  nextTime: { color: "#FFF", fontSize: 32, fontWeight: "700", marginTop: 8 },
  nextText: { color: "#FFF", marginTop: 4 },
  action: { backgroundColor: "#FFF", borderRadius: 12, minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: 16 },
  actionText: { fontWeight: "700" },
  section: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  doseTime: { fontWeight: "700", fontSize: 16 },
  status: { fontSize: 12, marginTop: 3 },
  info: { flex: 1 },
  name: { fontWeight: "700", fontSize: 16, marginBottom: 2 },
  empty: { textAlign: "center", paddingVertical: 30 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.35)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  confirm: { borderRadius: 12, minHeight: 48, alignItems: "center", justifyContent: "center" },
  confirmText: { color: "#FFF", fontWeight: "700" },
  cancel: { alignItems: "center", padding: 16 },
  pressed: { opacity: 0.8 },
});
