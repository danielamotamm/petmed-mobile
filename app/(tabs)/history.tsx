import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { DoseStatus } from "@/shared/petmed";

const filters: { label: string; value?: DoseStatus }[] = [
  { label: "Todos" },
  { label: "Administradas", value: "administered" },
  { label: "Perdidas", value: "missed" },
];

export default function HistoryScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [status, setStatus] = useState<DoseStatus | undefined>();
  const [range] = useState(() => {
    const now = new Date();
    return { from: new Date(now.getTime() - 30 * 86400000), to: new Date(now.getTime() + 86400000) };
  });
  const query = trpc.petmed.doses.history.useQuery({ ...range, status }, { enabled: Boolean(user) });

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ACOMPANHAMENTO</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Histórico</Text>
            <View style={styles.filters}>
              {filters.map((filter) => (
                <Pressable
                  key={filter.label}
                  accessibilityRole="button"
                  onPress={() => setStatus(filter.value)}
                  style={[styles.filter, { borderColor: filter.value === status ? colors.primary : colors.border, backgroundColor: filter.value === status ? colors.primary : colors.surface }]}
                >
                  <Text style={{ color: filter.value === status ? "#FFF" : colors.muted }}>{filter.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhuma dose encontrada no período.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.treatment.name}</Text>
              <Text style={{ color: colors.muted }}>
                {item.pet.name} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.administeredAt ?? item.scheduledAt)}
              </Text>
            </View>
            <Text style={{ color: item.status === "administered" ? colors.success : item.status === "missed" ? colors.warning : colors.muted }}>
              {item.status === "administered" ? "Administrada" : item.status === "missed" ? "Perdida" : "Pendente"}
            </Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 30 },
  header: { marginBottom: 18 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700", marginVertical: 5 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  filter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", gap: 10, marginBottom: 10 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  empty: { paddingVertical: 28, textAlign: "center" },
});
