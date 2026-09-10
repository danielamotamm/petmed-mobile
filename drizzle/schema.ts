import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const pets = mysqlTable(
  "pets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    species: varchar("species", { length: 80 }).notNull(),
    weight: varchar("weight", { length: 40 }).notNull(),
    avatar: varchar("avatar", { length: 4 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("pets_userId_idx").on(table.userId)],
);

export const medicationTreatments = mysqlTable(
  "medicationTreatments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    petId: int("petId")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    dose: varchar("dose", { length: 80 }).notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    instructions: text("instructions"),
    startDate: varchar("startDate", { length: 10 }).notNull(),
    endDate: varchar("endDate", { length: 10 }).notNull(),
    timezone: varchar("timezone", { length: 80 }).notNull(),
    status: mysqlEnum("status", ["active", "stopped", "completed"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("treatments_userId_petId_idx").on(table.userId, table.petId)],
);

export const treatmentSchedules = mysqlTable(
  "treatmentSchedules",
  {
    id: int("id").autoincrement().primaryKey(),
    treatmentId: int("treatmentId")
      .notNull()
      .references(() => medicationTreatments.id, { onDelete: "cascade" }),
    time: varchar("time", { length: 5 }).notNull(),
  },
  (table) => [unique("treatmentSchedules_treatmentId_time_unique").on(table.treatmentId, table.time)],
);

export const doseOccurrences = mysqlTable(
  "doseOccurrences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    petId: int("petId")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    treatmentId: int("treatmentId")
      .notNull()
      .references(() => medicationTreatments.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduledAt").notNull(),
    status: mysqlEnum("status", ["pending", "administered", "missed"]).default("pending").notNull(),
    administeredAt: timestamp("administeredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    unique("doseOccurrences_treatmentId_scheduledAt_unique").on(table.treatmentId, table.scheduledAt),
    index("doseOccurrences_userId_scheduledAt_idx").on(table.userId, table.scheduledAt),
    index("doseOccurrences_petId_scheduledAt_idx").on(table.petId, table.scheduledAt),
  ],
);

export type Pet = typeof pets.$inferSelect;
export type MedicationTreatment = typeof medicationTreatments.$inferSelect;
export type DoseOccurrence = typeof doseOccurrences.$inferSelect;
