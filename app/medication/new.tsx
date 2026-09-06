import { useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type MedicationRecord = { id: string; pet: string; name: string; dose: string; unit: string; frequency: string; times: string[]; durationDays: number; instructions: string; createdAt: string };
type DoseRecord = { id: string; time: string; pet: string; species: string; medication: string; dose: string; note?: string; status: "pending"; avatar: string };

const frequencies = ["1 vez ao dia", "2 vezes ao dia", "3 vezes ao dia", "Personalizada"];
const units = ["mg", "ml", "comprimido", "gotas"];
const pets = [{ name: "Luna", species: "Gato", avatar: "L" }, { name: "Thor", species: "Cachorro", avatar: "T" }];

export default function NewMedicationScreen() {
  const colors = useColors();
  const [pet, setPet] = useState(pets[0]);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [times, setTimes] = useState(["08:00"]);
  const [duration, setDuration] = useState("7");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const title = useMemo(() => frequency === "Personalizada" ? "Horários do tratamento" : "Horário da primeira dose", [frequency]);

  const addTime = () => {
    if (times.length >= 4) return;
    const next = times.length === 1 ? "20:00" : times.length === 2 ? "14:00" : "22:00";
    if (!times.includes(next)) setTimes([...times, next].sort());
  };
  const removeTime = (time: string) => { if (times.length > 1) setTimes(times.filter((item) => item !== time)); };
  const save = async () => {
    const parsedDuration = Number(duration);
    if (!name.trim() || !dose.trim() || !Number.isFinite(parsedDuration) || parsedDuration < 1 || times.length === 0) {
      setError("Preencha o nome, a dosagem, a duração e pelo menos um horário.");
      return;
    }
    setSaving(true);
    const medication: MedicationRecord = { id: `med-${Date.now()}`, pet: pet.name, name: name.trim(), dose: `${dose.trim()} ${unit}`, unit, frequency, times, durationDays: parsedDuration, instructions: instructions.trim(), createdAt: new Date().toISOString() };
    const existingMedications = JSON.parse((await AsyncStorage.getItem("petmed:medications")) || "[]") as MedicationRecord[];
    await AsyncStorage.setItem("petmed:medications", JSON.stringify([...existingMedications, medication]));
    const existingDoses = JSON.parse((await AsyncStorage.getItem("petmed:doses")) || "[]") as DoseRecord[];
    const newDoses: DoseRecord[] = times.map((time, index) => ({ id: `${medication.id}-${index}`, time, pet: pet.name, species: pet.species, medication: medication.name, dose: medication.dose, note: medication.instructions || `${medication.durationDays} dias de tratamento`, status: "pending", avatar: pet.avatar }));
    await AsyncStorage.setItem("petmed:doses", JSON.stringify([...existingDoses, ...newDoses]));
    setSaving(false);
    router.replace("/(tabs)/pets");
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.back}><IconSymbol name="chevron.left" size={24} color={colors.foreground} /></Pressable><View><Text style={[styles.eyebrow, { color: colors.primary }]}>NOVO CUIDADO</Text><Text style={[styles.title, { color: colors.foreground }]}>Medicamento</Text></View></View><Text style={[styles.intro, { color: colors.muted }]}>Configure a rotina completa para não esquecer nenhum detalhe do tratamento.</Text>
    <Text style={[styles.section, { color: colors.foreground }]}>Para qual pet?</Text><View style={styles.petRow}>{pets.map((item) => <Pressable key={item.name} onPress={() => setPet(item)} style={[styles.petChoice, { borderColor: item.name === pet.name ? colors.primary : colors.border, backgroundColor: item.name === pet.name ? colors.primaryLight : colors.surface }]}><View style={[styles.petAvatar, { backgroundColor: item.name === pet.name ? colors.primary : colors.background }]}><Text style={[styles.petAvatarText, { color: item.name === pet.name ? "#FFFFFF" : colors.primary }]}>{item.avatar}</Text></View><Text style={[styles.petChoiceText, { color: colors.foreground }]}>{item.name}</Text></Pressable>)}</View>
    <Text style={[styles.section, { color: colors.foreground }]}>Informações do medicamento</Text><Field label="Nome do medicamento" value={name} onChangeText={setName} placeholder="Ex.: Gabapentina" colors={colors} /><View style={styles.row}><View style={styles.flex}><Field label="Dosagem" value={dose} onChangeText={setDose} placeholder="Ex.: 100" keyboardType="decimal-pad" colors={colors} /></View><View style={styles.unitBox}><Text style={[styles.label, { color: colors.muted }]}>Unidade</Text><View style={styles.unitRow}>{units.slice(0, 2).map((item) => <Pressable key={item} onPress={() => setUnit(item)} style={[styles.unitChip, { borderColor: item === unit ? colors.primary : colors.border, backgroundColor: item === unit ? colors.primaryLight : colors.surface }]}><Text style={[styles.unitText, { color: item === unit ? colors.primary : colors.muted }]}>{item}</Text></Pressable>)}</View></View></View>
    <Text style={[styles.section, { color: colors.foreground }]}>Frequência</Text><View style={styles.chipWrap}>{frequencies.map((item) => <Pressable key={item} onPress={() => setFrequency(item)} style={[styles.chip, { borderColor: item === frequency ? colors.primary : colors.border, backgroundColor: item === frequency ? colors.primaryLight : colors.surface }]}><Text style={[styles.chipText, { color: item === frequency ? colors.primary : colors.muted }]}>{item}</Text></Pressable>)}</View>
    <Text style={[styles.section, { color: colors.foreground }]}>{title}</Text><View style={styles.timeRow}>{times.map((time) => <View key={time} style={[styles.timeChip, { backgroundColor: colors.primaryLight }]}><IconSymbol name="clock.fill" size={16} color={colors.primary} /><Text style={[styles.timeText, { color: colors.primary }]}>{time}</Text>{times.length > 1 && <Pressable onPress={() => removeTime(time)} accessibilityLabel={`Remover horário ${time}`}><Text style={[styles.remove, { color: colors.primary }]}>×</Text></Pressable>}</View>)}<Pressable onPress={addTime} style={[styles.addTime, { borderColor: colors.primary }]}><IconSymbol name="plus" size={17} color={colors.primary} /><Text style={[styles.addTimeText, { color: colors.primary }]}>Adicionar horário</Text></Pressable></View>
    <View style={styles.row}><View style={styles.flex}><Field label="Duração do tratamento" value={duration} onChangeText={setDuration} placeholder="7" keyboardType="number-pad" colors={colors} /></View><View style={styles.daysSuffix}><Text style={[styles.daysText, { color: colors.muted }]}>dias</Text></View></View><Field label="Instruções (opcional)" value={instructions} onChangeText={setInstructions} placeholder="Ex.: Após a refeição" colors={colors} />
    {error ? <View style={[styles.errorBox, { backgroundColor: "#FBEDED" }]}><IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} /><Text style={[styles.errorText, { color: colors.error }]}>{error}</Text></View> : null}<Pressable accessibilityRole="button" onPress={save} disabled={saving} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }, pressed && styles.pressed]}><Text style={styles.saveText}>{saving ? "SALVANDO..." : "SALVAR MEDICAMENTO"}</Text></Pressable></ScrollView></KeyboardAvoidingView></ScreenContainer>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType, colors }: { label: string; value: string; onChangeText: (text: string) => void; placeholder: string; keyboardType?: "decimal-pad" | "number-pad"; colors: ReturnType<typeof useColors> }) { return <View style={styles.field}><Text style={[styles.label, { color: colors.muted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>; }
const styles = StyleSheet.create({ flex: { flex: 1 }, content: { padding: 16, paddingBottom: 34 }, topbar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }, back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8 }, eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.6 }, title: { fontSize: 28, lineHeight: 36, fontWeight: "700", marginTop: 2 }, intro: { fontSize: 15, lineHeight: 22, marginBottom: 22 }, section: { fontSize: 17, lineHeight: 24, fontWeight: "700", marginTop: 15, marginBottom: 10 }, petRow: { flexDirection: "row", gap: 10 }, petChoice: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, padding: 8, paddingRight: 13 }, petAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }, petAvatarText: { fontSize: 14, fontWeight: "700" }, petChoiceText: { fontSize: 14, fontWeight: "600" }, field: { marginBottom: 12, flex: 1 }, label: { fontSize: 13, lineHeight: 18, fontWeight: "600", marginBottom: 6 }, input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16 }, row: { flexDirection: "row", alignItems: "flex-end", gap: 10 }, unitBox: { flex: 1, marginBottom: 12 }, unitRow: { flexDirection: "row", gap: 6 }, unitChip: { height: 52, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }, unitText: { fontSize: 13, fontWeight: "600" }, chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, chipText: { fontSize: 13, fontWeight: "600" }, timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, timeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 }, timeText: { fontSize: 14, fontWeight: "700" }, remove: { fontSize: 20, lineHeight: 18, marginLeft: 2 }, addTime: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }, addTimeText: { fontSize: 13, fontWeight: "700" }, daysSuffix: { height: 52, justifyContent: "center", paddingHorizontal: 5, marginBottom: 12 }, daysText: { fontSize: 15 }, errorBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, marginTop: 6 }, errorText: { flex: 1, fontSize: 13, lineHeight: 19 }, save: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 20 }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] } });
