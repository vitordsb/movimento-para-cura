import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../api/trpc";
import {
  createQuiz,
  createQuizQuestion,
  getActiveQuiz,
  getAllQuizzes,
  getQuizById,
  getQuizWithQuestions,
  getScoringConfigForQuiz,
  ensureBaselineQuizQuestions,
  updateQuizById,
  updateQuizQuestionById,
  deleteQuizQuestionById,
} from "../db";

export const quizzesRouter = router({
  /**
   * Get active quiz for patient (public, returns current quiz)
   */
  getActive: publicProcedure.query(async () => {
    console.log("DEBUG: getActive called");
    try {
      const quiz = await getActiveQuiz();
      console.log("DEBUG: quiz found?", quiz?.id, quiz?.name);

      if (!quiz) {
        console.log("DEBUG: No active quiz found in DB query");
        return null;
      }

      await ensureBaselineQuizQuestions();
      const full = await getQuizWithQuestions(quiz.id);
      console.log("DEBUG: full quiz questions count:", full?.questions?.length);
      return full;
    } catch (err) {
      console.error("DEBUG: Error in getActive:", err);
      throw err;
    }
  }),

  /**
   * Get specific quiz by ID with all questions and options
   */
  getById: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ input }) => {
      const quiz = await getQuizWithQuestions(input.quizId);
      if (!quiz) {
        throw new Error("Quiz not found");
      }
      return quiz;
    }),

  /**
   * List all quizzes (admin only)
   */
  list: adminProcedure.query(async () => {
    return await getAllQuizzes();
  }),

  /**
   * Create new quiz (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const quiz = await createQuiz({
        name: input.name,
        description: input.description,
        isActive: input.isActive,
        createdBy: ctx.user!.id,
      });
      return quiz;
    }),

  /**
   * Update quiz (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        quizId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await updateQuizById(input.quizId, updateData);
      return { success: true };
    }),

  /**
   * Create quiz question (admin only)
   */
  questions: router({
    create: adminProcedure
      .input(
        z.object({
          quizId: z.number(),
          text: z.string().min(1),
          questionType: z.enum(["YES_NO", "SCALE_0_10", "MULTIPLE_CHOICE"]),
          weight: z.number().min(0).default(1),
          order: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
        return await createQuizQuestion({
          quizId: input.quizId,
          text: input.text,
          questionType: input.questionType,
          weight: input.weight.toString(),
          order: input.order,
        });
      }),

    /**
     * Update quiz question (admin only)
     */
    update: adminProcedure
      .input(
        z.object({
          questionId: z.number(),
          text: z.string().optional(),
          weight: z.number().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updateData: any = {};
        if (input.text !== undefined) updateData.text = input.text;
        if (input.weight !== undefined)
          updateData.weight = input.weight.toString();
        if (input.order !== undefined) updateData.order = input.order;

        await updateQuizQuestionById(input.questionId, updateData);
        return { success: true };
      }),

    /**
     * Delete quiz question (admin only)
     */
    delete: adminProcedure
      .input(z.object({ questionId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteQuizQuestionById(input.questionId);
        return { success: true } as const;
      }),
  }),
});
