import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { scheduleTreatmentNotifications } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";
import { medicationUnits } from "@/shared/petmed";

const frequencyTimes: Record<string, string[]> = {
  "1 vez ao dia": ["08:00"],
  "2 vezes ao dia": ["08:00", "20:00"],
  "3 vezes ao dia": ["08:00", "14:00", "20:00"],
};
const today = () => new Intl.DateTimeFormat("en-CA").format(new Date());

export default function NewMedicationScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const pets = trpc.petmed.pets.list.useQuery(undefined, { enabled: Boolean(user) });

  const [petId, setPetId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState<(typeof medicationUnits)[number]>("mg");
  const [frequency, setFrequency] = useState("1 vez ao dia");
  const [timesText, setTimesText] = useState("08:00");
  const [duration, setDuration] = useState("7");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");

  const save = trpc.petmed.treatments.create.useMutation({
    onSuccess: async (result, input) => {
      const pet = pets.data?.find((item) => item.id === input.petId);
      // Best effort: local alarms must never block saving the treatment.
      void scheduleTreatmentNotifications({
        treatmentId: result.id,
        petName: pet?.name ?? "Seu pet",
        name: input.name,
        dose: input.dose,
        unit: input.unit,
        times: input.times,
        startDate: input.startDate,
        durationDays: input.durationDays,
      });
      await Promise.all([utils.petmed.pets.list.invalidate(), utils.petmed.doses.today.invalidate()]);
      router.dismissTo("/(tabs)/pets");
    },
    onError: (cause) => setError(cause.message || "Não foi possível salvar o medicamento."),
  });

  const setPreset = (value: string) => {
    setFrequency(value);
    if (value !== "Personalizada") setTimesText(frequencyTimes[value].join(", "));
  };

  const submit = () => {
    const times = timesText.split(",").map((time) => time.trim()).filter(Boolean);
    const parsedDuration = Number(duration);
    if (!petId || !name.trim() || !dose.trim() || !Number.isInteger(parsedDuration) || parsedDuration < 1 || !times.length) {
      setError("Preencha todos os campos obrigatórios e escolha um pet.");
      return;
    }
    const invalidTime = times.find((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time));
    if (invalidTime) {
      setError(`Horário inválido: "${invalidTime}". Use HH:MM, ex.: 08:00.`);
      return;
    }
    setError("");
    save.mutate({
      petId,
      name: name.trim(),
      dose: dose.trim(),
      unit,
      durationDays: parsedDuration,
      times,
      instructions: instructions.trim() || undefined,
      startDate: today(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  // AuthGate guarantees an authenticated user on this route.
  if (!user) return null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.eyebrow, { color: colors.primary }]}>NOVO CUIDADO</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Medicamento</Text>

          <Label text="Para qual pet?" colors={colors} />
          <View style={styles.wrap}>
            {(pets.data ?? []).map((pet) => (
              <Pressable key={pet.id} accessibilityRole="button" onPress={() => setPetId(pet.id)} style={[styles.chip, { borderColor: petId === pet.id ? colors.primary : colors.border, backgroundColor: petId === pet.id ? colors.primaryLight : colors.surface }]}>
                <Text style={{ color: petId === pet.id ? colors.primary : colors.foreground }}>{pet.name}</Text>
              </Pressable>
            ))}
          </View>
          {pets.data?.length === 0 && <Text style={{ color: colors.error }}>Cadastre pelo menos um pet antes de adicionar medicamento.</Text>}

          <Field label="Nome do medicamento" value={name} onChange={setName} colors={colors} />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label="Dosagem" value={dose} onChange={setDose} keyboardType="decimal-pad" colors={colors} />
            </View>
            <View style={styles.flex}>
              <Label text="Unidade" colors={colors} />
              <View style={styles.wrap}>
                {medicationUnits.map((value) => (
                  <Pressable key={value} accessibilityRole="button" onPress={() => setUnit(value)} style={[styles.chip, { borderColor: unit === value ? colors.primary : colors.border }]}>
                    <Text style={{ color: unit === value ? colors.primary : colors.muted }}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Label text="Frequência" colors={colors} />
          <View style={styles.wrap}>
            {[...Object.keys(frequencyTimes), "Personalizada"].map((value) => (
              <Pressable key={value} accessibilityRole="button" onPress={() => setPreset(value)} style={[styles.chip, { borderColor: frequency === value ? colors.primary : colors.border }]}>
                <Text style={{ color: frequency === value ? colors.primary : colors.muted }}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Field label={frequency === "Personalizada" ? "Horários (separados por vírgula)" : "Horários"} value={timesText} onChange={setTimesText} placeholder="08:00, 20:00" colors={colors} />
          <Field label="Duração (dias)" value={duration} onChange={setDuration} keyboardType="number-pad" colors={colors} />
          <Field label="Instruções (opcional)" value={instructions} onChange={setInstructions} colors={colors} />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={save.isPending || pets.data?.length === 0}
            onPress={submit}
            style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: save.isPending || pets.data?.length === 0 ? 0.6 : 1 }, pressed && styles.pressed]}
          >
            <Text style={styles.saveText}>{save.isPending ? "SALVANDO..." : "SALVAR MEDICAMENTO"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>CANCELAR</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.label, { color: colors.muted }]}>{text}</Text>;
}

function Field({ label, value, onChange, colors, placeholder, keyboardType }: { label: string; value: string; onChange: (value: string) => void; colors: ReturnType<typeof useColors>; placeholder?: string; keyboardType?: "decimal-pad" | "number-pad" }) {
  return (
    <View style={styles.field}>
      <Label text={label} colors={colors} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 34 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.7 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 22 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 14, marginBottom: 7 },
  field: { flex: 1 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  row: { flexDirection: "row", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  error: { marginTop: 12 },
  save: { minHeight: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 24 },
  saveText: { color: "#FFF", fontWeight: "700" },
  cancel: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  cancelText: { fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
