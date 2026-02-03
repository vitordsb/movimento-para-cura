import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../api/trpc";
import {
  createExerciseTutorial,
  getAllExercises,
  getExercisesByIntensity,
  updateExerciseTutorialById,
  deleteExerciseTutorialById,
} from "../db";

export const exercisesRouter = router({
  /**
   * Get all exercises (public)
   */
  list: publicProcedure.query(async () => {
    return await getAllExercises();
  }),

  /**
   * Get exercises by intensity level (public)
   */
  getByIntensity: publicProcedure
    .input(
      z.object({
        intensity: z.enum(["LIGHT", "MODERATE", "STRONG"]),
      })
    )
    .query(async ({ input }) => {
      return await getExercisesByIntensity(input.intensity);
    }),

  /**
   * Create exercise (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        intensityLevel: z.enum(["LIGHT", "MODERATE", "STRONG"]),
        safetyGuidelines: z.string().optional(),
        videoLink: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createExerciseTutorial({
        name: input.name,
        description: input.description ?? null,
        intensityLevel: input.intensityLevel,
        safetyGuidelines: input.safetyGuidelines ?? null,
        videoLink: input.videoLink ?? null,
      });
    }),

  /**
   * Update exercise (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        exerciseId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        intensityLevel: z.enum(["LIGHT", "MODERATE", "STRONG"]).optional(),
        safetyGuidelines: z.string().optional(),
        videoLink: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.intensityLevel !== undefined)
        updateData.intensityLevel = input.intensityLevel;
      if (input.safetyGuidelines !== undefined)
        updateData.safetyGuidelines = input.safetyGuidelines;
      if (input.videoLink !== undefined) updateData.videoLink = input.videoLink;

      await updateExerciseTutorialById(input.exerciseId, updateData);
      return { success: true } as const;
    }),

  /**
   * Delete exercise (admin only)
   */
  delete: adminProcedure
    .input(z.object({ exerciseId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteExerciseTutorialById(input.exerciseId);
      return { success: true } as const;
    }),
});
