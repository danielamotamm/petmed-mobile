import { and, asc, eq, gte, lt, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  doseOccurrences,
  InsertUser,
  medicationTreatments,
  pets,
  treatmentSchedules,
  users,
} from "../drizzle/schema";
import type { DoseStatus, DoseWithDetails, PetSummary } from "../shared/petmed";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function getUtcDate(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let value = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  // Correct the UTC guess by the timezone offset at this instant. A second pass
  // handles daylight-saving transitions without adding a date-time dependency.
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(value)).map(({ type, value }) => [type, value]),
    );
    const displayed = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    value += Date.UTC(year, month - 1, day, hour, minute) - displayed;
  }
  return new Date(value);
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function assertTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new Error("Invalid timezone");
  }
}

export async function listPets(userId: number): Promise<PetSummary[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const userPets = await db.select().from(pets).where(eq(pets.userId, userId)).orderBy(asc(pets.name));
  const treatments = await db
    .select()
    .from(medicationTreatments)
    .where(and(eq(medicationTreatments.userId, userId), eq(medicationTreatments.status, "active")));
  const pending = await db
    .select()
    .from(doseOccurrences)
    .where(and(eq(doseOccurrences.userId, userId), eq(doseOccurrences.status, "pending"), gte(doseOccurrences.scheduledAt, new Date())))
    .orderBy(asc(doseOccurrences.scheduledAt));

  return userPets.map((pet) => ({
    ...pet,
    activeTreatmentCount: treatments.filter((treatment) => treatment.petId === pet.id).length,
    nextDoseAt: pending.find((dose) => dose.petId === pet.id)?.scheduledAt ?? null,
  }));
}

export async function createPet(userId: number, pet: Omit<typeof pets.$inferInsert, "id" | "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(pets).values({ ...pet, userId });
  const id = Number(result[0].insertId);
  const created = await db.select().from(pets).where(and(eq(pets.id, id), eq(pets.userId, userId))).limit(1);
  if (!created[0]) throw new Error("Could not create pet");
  return created[0];
}

export async function getPet(userId: number, petId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).limit(1);
  return result[0];
}

export async function getPetTreatments(userId: number, petId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db
    .select()
    .from(medicationTreatments)
    .where(and(eq(medicationTreatments.userId, userId), eq(medicationTreatments.petId, petId)))
    .orderBy(asc(medicationTreatments.endDate));
}

export async function createTreatment(
  userId: number,
  input: {
    petId: number;
    name: string;
    dose: string;
    unit: string;
    instructions?: string;
    startDate: string;
    durationDays: number;
    timezone: string;
    times: string[];
  },
) {
  assertTimezone(input.timezone);
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const pet = await getPet(userId, input.petId);
  if (!pet) throw new Error("Pet not found");
  const endDate = addDays(input.startDate, input.durationDays - 1);

  return db.transaction(async (tx) => {
    const result = await tx.insert(medicationTreatments).values({
      userId,
      petId: input.petId,
      name: input.name,
      dose: input.dose,
      unit: input.unit,
      instructions: input.instructions || null,
      startDate: input.startDate,
      endDate,
      timezone: input.timezone,
    });
    const treatmentId = Number(result[0].insertId);
    await tx.insert(treatmentSchedules).values(input.times.map((time) => ({ treatmentId, time })));

    const occurrences = Array.from({ length: input.durationDays }, (_, day) => {
      const scheduledDate = addDays(input.startDate, day);
      return input.times.map((time) => ({
        userId,
        petId: input.petId,
        treatmentId,
        scheduledAt: getUtcDate(scheduledDate, time, input.timezone),
      }));
    }).flat();
    await tx.insert(doseOccurrences).values(occurrences);
    return { id: treatmentId, endDate };
  });
}

/**
 * Grace window after the scheduled time during which a pending dose can still
 * be administered. Past it, the dose is considered missed.
 */
const MISSED_GRACE_MS = 2 * 60 * 60 * 1000;

/**
 * Lazily marks overdue pending doses as missed. Runs before every listing so
 * no cron job is required and the result is always consistent for the user.
 */
async function markOverdueDosesAsMissed(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number) {
  const cutoff = new Date(Date.now() - MISSED_GRACE_MS);
  await db
    .update(doseOccurrences)
    .set({ status: "missed" })
    .where(
      and(
        eq(doseOccurrences.userId, userId),
        eq(doseOccurrences.status, "pending"),
        lte(doseOccurrences.scheduledAt, cutoff),
      ),
    );
}

async function listDoses(userId: number, start: Date, end: Date): Promise<DoseWithDetails[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await markOverdueDosesAsMissed(db, userId);
  const rows = await db
    .select({ occurrence: doseOccurrences, pet: pets, treatment: medicationTreatments })
    .from(doseOccurrences)
    .innerJoin(pets, eq(doseOccurrences.petId, pets.id))
    .innerJoin(medicationTreatments, eq(doseOccurrences.treatmentId, medicationTreatments.id))
    .where(
      and(
        eq(doseOccurrences.userId, userId),
        gte(doseOccurrences.scheduledAt, start),
        lt(doseOccurrences.scheduledAt, end),
      ),
    )
    .orderBy(asc(doseOccurrences.scheduledAt));
  return rows.map(({ occurrence, pet, treatment }) => ({
    id: occurrence.id,
    scheduledAt: occurrence.scheduledAt,
    administeredAt: occurrence.administeredAt,
    status: occurrence.status as DoseStatus,
    pet: { id: pet.id, name: pet.name, species: pet.species, avatar: pet.avatar },
    treatment: {
      id: treatment.id,
      name: treatment.name,
      dose: treatment.dose,
      unit: treatment.unit,
      instructions: treatment.instructions,
    },
  }));
}

export async function listDosesForDate(userId: number, date: string, timezone: string) {
  assertTimezone(timezone);
  return listDoses(userId, getUtcDate(date, "00:00", timezone), getUtcDate(addDays(date, 1), "00:00", timezone));
}

export async function listDoseHistory(userId: number, from: Date, to: Date, status?: DoseStatus) {
  const doses = await listDoses(userId, from, to);
  return status ? doses.filter((dose) => dose.status === status) : doses;
}

export async function administerDose(userId: number, doseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const existing = await db
    .select()
    .from(doseOccurrences)
    .where(and(eq(doseOccurrences.id, doseId), eq(doseOccurrences.userId, userId)))
    .limit(1);
  const dose = existing[0];
  if (!dose) throw new Error("Dose not found");
  if (dose.status === "administered") return dose;
  // Late confirmation still counts: a pending dose past the grace window is
  // shown as missed, but administering it must record it correctly.
  await db
    .update(doseOccurrences)
    .set({ status: "administered", administeredAt: new Date() })
    .where(and(eq(doseOccurrences.id, doseId), eq(doseOccurrences.userId, userId)));
  return { ...dose, status: "administered" as const };
}

export async function stopTreatment(userId: number, treatmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db
    .update(medicationTreatments)
    .set({ status: "stopped" })
    .where(and(eq(medicationTreatments.id, treatmentId), eq(medicationTreatments.userId, userId)));
  if (result[0].affectedRows === 0) throw new Error("Treatment not found");
  return { success: true } as const;
}
