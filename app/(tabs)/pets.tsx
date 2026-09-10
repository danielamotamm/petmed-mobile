import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function PetsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const query = trpc.petmed.pets.list.useQuery(undefined, { enabled: Boolean(user) });

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  const hasPets = (query.data?.length ?? 0) > 0;

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
            <Text style={[styles.eyebrow, { color: colors.primary }]}>SEUS COMPANHEIROS</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Pets</Text>
            <Text style={{ color: colors.muted }}>Todos os cuidados ficam sincronizados na sua conta.</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhum pet cadastrado ainda.</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir perfil de ${item.name}`}
            onPress={() => router.push({ pathname: "/pet/[id]", params: { id: item.id } })}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 22 }}>{item.avatar}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={{ color: colors.muted }}>{item.species} · {item.weight}</Text>
              <Text style={{ color: colors.primary, marginTop: 6 }}>
                {item.activeTreatmentCount} medicamento{item.activeTreatmentCount === 1 ? "" : "s"} ativo{item.activeTreatmentCount === 1 ? "" : "s"}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={22} color={colors.muted} />
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/pet/new")} style={({ pressed }) => [styles.add, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }, pressed && styles.pressed]}>
              <Text style={[styles.addText, { color: colors.primary }]}>ADICIONAR PET</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!hasPets}
              onPress={() => router.push("/medication/new")}
              style={({ pressed }) => [styles.add, { backgroundColor: colors.primary, opacity: hasPets ? 1 : 0.5 }, pressed && styles.pressed]}
            >
              <Text style={styles.addText}>ADICIONAR MEDICAMENTO</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 30 },
  header: { gap: 5, marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 13 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700" },
  empty: { textAlign: "center", paddingVertical: 28 },
  add: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10 },
  addText: { color: "#FFF", fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
