import { z } from "zod";
import { patientProcedure, router } from "../api/trpc";
import {
  addWaterIntake,
  getTodayHydration,
  logSymptom,
  getRecentSymptoms,
} from "../db";

export const healthRouter = router({
  addWater: patientProcedure
    .input(z.object({ amountMl: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      return await addWaterIntake(ctx.user.id, input.amountMl);
    }),

  getHydration: patientProcedure
    .query(async ({ ctx }) => {
      const hydration = await getTodayHydration(ctx.user.id);
      return hydration || { currentIntakeMl: 0, dailyGoalMl: 2000 };
    }),

  logSymptom: patientProcedure
    .input(z.object({
      symptom: z.string().min(1),
      intensity: z.number().min(1).max(10),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await logSymptom(ctx.user.id, input);
    }),

  getSymptoms: patientProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      return await getRecentSymptoms(ctx.user.id, input.limit);
    }),
});
