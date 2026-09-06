import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type DoseStatus = "pending" | "current" | "administered" | "missed";
type Dose = {
  id: string;
  time: string;
  pet: string;
  species: string;
  medication: string;
  dose: string;
  note?: string;
  status: DoseStatus;
  avatar: string;
};

const INITIAL_DOSES: Dose[] = [
  { id: "1", time: "08:00", pet: "Luna", species: "Gato", medication: "Gabapentina", dose: "100 mg", note: "Após a refeição", status: "administered", avatar: "L" },
  { id: "2", time: "14:00", pet: "Luna", species: "Gato", medication: "Gabapentina", dose: "100 mg", note: "Após a refeição", status: "current", avatar: "L" },
  { id: "3", time: "18:30", pet: "Thor", species: "Cachorro", medication: "Amoxicilina", dose: "1 comprimido", status: "pending", avatar: "T" },
  { id: "4", time: "22:00", pet: "Luna", species: "Gato", medication: "Meloxicam", dose: "0,5 ml", status: "pending", avatar: "L" },
];

const statusCopy: Record<DoseStatus, { label: string; icon: "circle" | "clock.fill" | "checkmark.circle.fill" | "exclamationmark.triangle.fill"; color: "muted" | "success" | "warning" }> = {
  pending: { label: "Pendente", icon: "circle", color: "muted" },
  current: { label: "Agora", icon: "clock.fill", color: "warning" },
  administered: { label: "Administrada", icon: "checkmark.circle.fill", color: "success" },
  missed: { label: "Perdida", icon: "exclamationmark.triangle.fill", color: "warning" },
};

export default function HomeScreen() {
  const colors = useColors();
  const [doses, setDoses] = useState(INITIAL_DOSES);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDose, setSelectedDose] = useState<Dose | null>(null);
  useEffect(() => {
    AsyncStorage.getItem("petmed:doses").then((stored) => {
      if (stored) setDoses(JSON.parse(stored) as Dose[]);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem("petmed:doses", JSON.stringify(doses));
  }, [doses, hydrated]);
  const [toast, setToast] = useState<string | null>(null);
  const nextDose = useMemo(() => doses.find((dose) => dose.status === "current" || dose.status === "pending"), [doses]);
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const todayLabelCapitalized = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  const completeDose = () => {
    if (!selectedDose) return;
    setDoses((current) => current.map((dose) => dose.id === selectedDose.id ? { ...dose, status: "administered" } : dose));
    setSelectedDose(null);
    setToast("Dose registrada com sucesso");
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setToast(null), 2400);
  };

  const renderDose = ({ item }: { item: Dose }) => {
    const status = statusCopy[item.status];
    const statusColor = colors[status.color];
    return (
      <View style={[styles.doseRow, { borderBottomColor: colors.border }]}> 
        <View style={styles.timeColumn}>
          <Text style={[styles.doseTime, { color: colors.foreground }]}>{item.time}</Text>
          <View style={styles.timelineDotWrap}><View style={[styles.timelineDot, { backgroundColor: item.status === "administered" ? colors.success : colors.border }]} /></View>
        </View>
        <View style={[styles.doseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.doseTopLine}>
            <View style={[styles.avatarSmall, { backgroundColor: colors.primaryLight }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{item.avatar}</Text></View>
            <View style={styles.doseIdentity}>
              <Text style={[styles.petName, { color: colors.foreground }]}>{item.pet} <Text style={[styles.species, { color: colors.muted }]}>· {item.species}</Text></Text>
              <Text style={[styles.medication, { color: colors.foreground }]}>{item.medication}</Text>
              <Text style={[styles.doseAmount, { color: colors.muted }]}>{item.dose}{item.note ? `  ·  ${item.note}` : ""}</Text>
            </View>
            <View style={styles.statusColumn}>
              <IconSymbol name={status.icon} size={18} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{status.label}</Text>
            </View>
          </View>
          {item.status !== "administered" && <Pressable accessibilityRole="button" accessibilityLabel={`Dar ${item.medication} para ${item.pet} às ${item.time}`} onPress={() => setSelectedDose(item)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.smallButtonText}>DAR AGORA</Text></Pressable>}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <FlatList
        data={doses}
        keyExtractor={(item) => item.id}
        renderItem={renderDose}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <View style={styles.headerRow}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>PETMED</Text><Text style={[styles.greeting, { color: colors.foreground }]}>Olá, Daniela</Text><Text style={[styles.date, { color: colors.muted }]}>{todayLabelCapitalized}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Notificações" style={styles.iconButton}><IconSymbol name="bell.fill" size={22} color={colors.foreground} /></Pressable></View>
          <View style={styles.summaryRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seu dia</Text><View style={[styles.summaryPill, { backgroundColor: colors.primaryLight }]}><Text style={[styles.summaryText, { color: colors.primary }]}>{doses.length} doses hoje</Text></View></View>
          {nextDose && <View style={[styles.nextCard, { backgroundColor: colors.primary, shadowColor: colors.primaryDark }]}><View style={styles.nextCardHeader}><View style={styles.nextBadge}><IconSymbol name="clock.fill" size={15} color={colors.primary} /><Text style={[styles.nextBadgeText, { color: colors.primary }]}>PRÓXIMA DOSE</Text></View><Text style={styles.nextTime}>{nextDose.time}</Text></View><View style={styles.nextInfo}><View style={styles.avatarLarge}><Text style={[styles.avatarLargeText, { color: colors.primary }]}>{nextDose.avatar}</Text></View><View style={styles.nextIdentity}><Text style={styles.nextPet}>{nextDose.pet} <Text style={styles.nextSpecies}>· {nextDose.species}</Text></Text><Text style={styles.nextMedication}>{nextDose.medication}</Text><Text style={styles.nextDose}>{nextDose.dose}{nextDose.note ? `  ·  ${nextDose.note}` : ""}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel={`Dar ${nextDose.medication} agora`} onPress={() => setSelectedDose(nextDose)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} /><Text style={[styles.primaryButtonText, { color: colors.primary }]}>DAR AGORA</Text></Pressable></View>}
          <View style={styles.agendaHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Agenda de hoje</Text><Text style={[styles.agendaMeta, { color: colors.muted }]}>Toque para registrar</Text></View>
        </>}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
      {toast && <View style={[styles.toast, { backgroundColor: colors.foreground }]}><IconSymbol name="checkmark.circle.fill" size={18} color={colors.surface} /><Text style={[styles.toastText, { color: colors.surface }]}>{toast}</Text></View>}
      <Modal visible={Boolean(selectedDose)} transparent animationType="slide" onRequestClose={() => setSelectedDose(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.sheet, { backgroundColor: colors.surface }]}><View style={[styles.sheetHandle, { backgroundColor: colors.border }]} /><Text style={[styles.sheetEyebrow, { color: colors.primary }]}>CONFIRMAR DOSE</Text><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Registrar medicamento?</Text>{selectedDose && <View style={[styles.confirmCard, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.confirmTime, { color: colors.foreground }]}>{selectedDose.time}</Text><View><Text style={[styles.confirmMedication, { color: colors.foreground }]}>{selectedDose.medication}</Text><Text style={[styles.confirmDetails, { color: colors.muted }]}>{selectedDose.pet} · {selectedDose.dose}</Text></View></View>}<Pressable accessibilityRole="button" onPress={completeDose} style={({ pressed }) => [styles.confirmButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.confirmButtonText}>CONFIRMAR COMO ADMINISTRADA</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setSelectedDose(null)} style={styles.cancelButton}><Text style={[styles.cancelButtonText, { color: colors.primary }]}>CANCELAR</Text></Pressable></View></View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingTop: 18, paddingBottom: 30 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  greeting: { fontSize: 28, lineHeight: 36, fontWeight: "700", marginTop: 4 },
  date: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: "700" },
  summaryPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  summaryText: { fontSize: 12, fontWeight: "600" },
  nextCard: { borderRadius: 18, padding: 18, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3, marginBottom: 28 },
  nextCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E7F2EF", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  nextBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  nextTime: { color: "#FFFFFF", fontSize: 32, lineHeight: 40, fontWeight: "700" },
  nextInfo: { flexDirection: "row", alignItems: "center", marginTop: 19, marginBottom: 18 },
  avatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E7F2EF", alignItems: "center", justifyContent: "center", marginRight: 13 },
  avatarLargeText: { fontSize: 24, fontWeight: "700" },
  nextIdentity: { flex: 1 },
  nextPet: { color: "#FFFFFF", fontSize: 17, lineHeight: 24, fontWeight: "700" },
  nextSpecies: { color: "#D4EBE5", fontWeight: "400" },
  nextMedication: { color: "#FFFFFF", fontSize: 16, lineHeight: 24, marginTop: 2 },
  nextDose: { color: "#D4EBE5", fontSize: 14, lineHeight: 20, marginTop: 1 },
  primaryButton: { height: 48, borderRadius: 12, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { fontSize: 15, lineHeight: 20, fontWeight: "700", letterSpacing: 0.4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  agendaHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11 },
  agendaMeta: { fontSize: 12 },
  doseRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 0 },
  timeColumn: { width: 55, alignItems: "flex-start", paddingTop: 12 },
  doseTime: { fontSize: 14, fontWeight: "700" },
  timelineDotWrap: { position: "absolute", right: 5, top: 34, width: 8, height: 8, borderRadius: 4, backgroundColor: "#F7F9F8" },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  doseCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12 },
  doseTopLine: { flexDirection: "row", alignItems: "flex-start" },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { fontSize: 17, fontWeight: "700" },
  doseIdentity: { flex: 1 },
  petName: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  species: { fontWeight: "400" },
  medication: { fontSize: 15, lineHeight: 21, fontWeight: "600", marginTop: 2 },
  doseAmount: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  statusColumn: { alignItems: "flex-end", gap: 2, minWidth: 48 },
  statusText: { fontSize: 10, fontWeight: "600" },
  smallButton: { alignSelf: "flex-start", minHeight: 36, borderRadius: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", marginTop: 12 },
  smallButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  footerSpace: { height: 20 },
  toast: { position: "absolute", bottom: 18, left: 24, right: 24, minHeight: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  toastText: { fontSize: 14, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(31,41,38,0.36)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 34 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  sheetEyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  sheetTitle: { fontSize: 24, lineHeight: 32, fontWeight: "700", marginTop: 6, marginBottom: 18 },
  confirmCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 15, marginBottom: 18 },
  confirmTime: { fontSize: 24, fontWeight: "700" },
  confirmMedication: { fontSize: 16, fontWeight: "700" },
  confirmDetails: { fontSize: 14, marginTop: 2 },
  confirmButton: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", textAlign: "center" },
  cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 4 },
  cancelButtonText: { fontSize: 15, fontWeight: "700" },
});
