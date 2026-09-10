import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function NewPetScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  const create = trpc.petmed.pets.create.useMutation({
    onSuccess: async (pet) => {
      await utils.petmed.pets.list.invalidate();
      router.dismissTo({ pathname: "/pet/[id]", params: { id: pet.id } });
    },
    onError: (cause) => setError(cause.message),
  });

  const submit = () => {
    if (!name.trim() || !species.trim() || !weight.trim()) {
      setError("Preencha nome, espécie e peso.");
      return;
    }
    setError("");
    create.mutate({
      name: name.trim(),
      species: species.trim(),
      weight: weight.trim(),
      avatar: name.trim().charAt(0).toUpperCase(),
    });
  };

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>NOVO COMPANHEIRO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Adicionar pet</Text>
        <Field label="Nome" value={name} onChange={setName} colors={colors} />
        <Field label="Espécie" value={species} onChange={setSpecies} placeholder="Ex.: Gato" colors={colors} />
        <Field label="Peso" value={weight} onChange={setWeight} placeholder="Ex.: 4,2 kg" colors={colors} />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={create.isPending}
          onPress={submit}
          style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: create.isPending ? 0.6 : 1 }, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>{create.isPending ? "SALVANDO..." : "SALVAR PET"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>CANCELAR</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function Field({ label, value, onChange, placeholder, colors }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 14, marginBottom: 7 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  error: { marginTop: 12 },
  save: { minHeight: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 24 },
  saveText: { color: "#FFF", fontWeight: "700" },
  cancel: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  cancelText: { fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
