import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { cancelTreatmentNotifications } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

export default function PetProfileScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const utils = trpc.useUtils();
  const query = trpc.petmed.pets.byId.useQuery({ id: petId }, { enabled: Boolean(user) && Number.isInteger(petId) });
  const stop = trpc.petmed.treatments.stop.useMutation({
    onSuccess: async (_result, input) => {
      void cancelTreatmentNotifications(input.id);
      await Promise.all([utils.petmed.pets.byId.invalidate({ id: petId }), utils.petmed.pets.list.invalidate()]);
    },
  });

  if (!user || query.isLoading) {
    return (
      <ScreenContainer edges={["top"]}>
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Carregando pet...</Text>
        </View>
      </ScreenContainer>
    );
  }
  if (!query.data) {
    return (
      <ScreenContainer edges={["top"]}>
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Pet não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const { pet, treatments } = query.data;

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={{ color: colors.primary }}>Voltar para pets</Text>
        </Pressable>
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: "700" }}>{pet.avatar}</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>{pet.name}</Text>
            <Text style={{ color: colors.muted }}>{pet.species} · {pet.weight}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Medicamentos</Text>
        {treatments.length === 0 ? (
          <Text style={{ color: colors.muted }}>Nenhum medicamento cadastrado.</Text>
        ) : (
          treatments.map((treatment) => (
            <View key={treatment.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.name, { color: colors.foreground }]}>{treatment.name}</Text>
              <Text style={{ color: colors.muted }}>{treatment.dose} {treatment.unit} · até {treatment.endDate}</Text>
              <View style={styles.cardFooter}>
                <Text style={{ color: treatment.status === "active" ? colors.success : colors.muted }}>
                  {treatment.status === "active" ? "Ativo" : "Encerrado"}
                </Text>
                {treatment.status === "active" && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Encerrar tratamento ${treatment.name}`}
                    disabled={stop.isPending}
                    onPress={() => stop.mutate({ id: treatment.id })}
                    style={({ pressed }) => [styles.stop, pressed && styles.pressed]}
                  >
                    <Text style={{ color: colors.error, fontWeight: "700", opacity: stop.isPending ? 0.6 : 1 }}>ENCERRAR</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
        <Pressable accessibilityRole="button" onPress={() => router.push("/medication/new")} style={({ pressed }) => [styles.add, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Text style={styles.addText}>ADICIONAR MEDICAMENTO</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingTop: 18, paddingBottom: 30 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700" },
  section: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 5, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  stop: { minHeight: 36, justifyContent: "center", paddingHorizontal: 8 },
  name: { fontSize: 16, fontWeight: "700" },
  add: { minHeight: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 14 },
  addText: { color: "#FFF", fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
