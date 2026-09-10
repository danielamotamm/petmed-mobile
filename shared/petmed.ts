export const medicationUnits = ["mg", "ml", "comprimido", "gotas"] as const;
export const doseStatuses = ["pending", "administered", "missed"] as const;

export type MedicationUnit = (typeof medicationUnits)[number];
export type DoseStatus = (typeof doseStatuses)[number];

export type PetSummary = {
  id: number;
  name: string;
  species: string;
  weight: string;
  avatar: string;
  activeTreatmentCount: number;
  nextDoseAt: Date | null;
};

export type DoseWithDetails = {
  id: number;
  scheduledAt: Date;
  administeredAt: Date | null;
  status: DoseStatus;
  pet: Pick<PetSummary, "id" | "name" | "species" | "avatar">;
  treatment: { id: number; name: string; dose: string; unit: string; instructions: string | null };
};
