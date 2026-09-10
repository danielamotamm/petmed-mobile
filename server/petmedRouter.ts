import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { doseStatuses, medicationUnits } from "../shared/petmed";
import { protectedProcedure, router } from "./_core/trpc";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

function dbError(error: unknown): never {
  if (error instanceof Error && /not found/i.test(error.message)) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  throw error;
}

export const petmedRouter = router({
  pets: router({
    list: protectedProcedure.query(({ ctx }) => db.listPets(ctx.user.id)),
    byId: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const pet = await db.getPet(ctx.user.id, input.id);
      if (!pet) throw new TRPCError({ code: "NOT_FOUND", message: "Pet not found" });
      const treatments = await db.getPetTreatments(ctx.user.id, input.id);
      return { pet, treatments };
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120), species: z.string().trim().min(1).max(80), weight: z.string().trim().min(1).max(40), avatar: z.string().trim().min(1).max(4) }))
      .mutation(({ ctx, input }) => db.createPet(ctx.user.id, input)),
  }),
  treatments: router({
    create: protectedProcedure
      .input(z.object({ petId: z.number().int().positive(), name: z.string().trim().min(1).max(160), dose: z.string().trim().min(1).max(80), unit: z.enum(medicationUnits), instructions: z.string().trim().max(2_000).optional(), startDate: dateSchema, durationDays: z.number().int().min(1).max(365), timezone: z.string().trim().min(1).max(80), times: z.array(timeSchema).min(1).max(6).refine((times) => new Set(times).size === times.length, "Times must be unique") }))
      .mutation(async ({ ctx, input }) => {
        try { return await db.createTreatment(ctx.user.id, input); } catch (error) { return dbError(error); }
      }),
    stop: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await db.stopTreatment(ctx.user.id, input.id); } catch (error) { return dbError(error); }
    }),
  }),
  doses: router({
    today: protectedProcedure.input(z.object({ date: dateSchema, timezone: z.string().trim().min(1).max(80) })).query(({ ctx, input }) => db.listDosesForDate(ctx.user.id, input.date, input.timezone)),
    history: protectedProcedure.input(z.object({ from: z.coerce.date(), to: z.coerce.date(), status: z.enum(doseStatuses).optional() })).query(({ ctx, input }) => db.listDoseHistory(ctx.user.id, input.from, input.to, input.status)),
    administer: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await db.administerDose(ctx.user.id, input.id); } catch (error) { return dbError(error); }
    }),
  }),
});
