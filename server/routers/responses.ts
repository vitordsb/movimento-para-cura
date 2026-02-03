import { z } from "zod";
import { publicProcedure, patientProcedure, oncologistProcedure, router } from "../api/trpc";
import {
  getTodayResponse,
  getPatientResponses,
  getQuizWithQuestions,
  insertQuizResponse,
} from "../db";

function determineDailyDecision(questions: any[], answers: Record<number, string>) {
  const byOrder = (order: number) => {
    const q = questions.find((question) => question.order === order);
    if (!q) return undefined;
    return answers[q.id];
  };

  const energy = byOrder(1);
  const fatigue = byOrder(2);
  const pain = byOrder(3);
  const symptoms = byOrder(4);
  const treatmentDay = byOrder(5);
  const sleep = byOrder(6);
  const emotional = byOrder(7);
  const safety = byOrder(8);
  const discomfort = byOrder(9);

  const isRest =
    fatigue === "FATIGUE_INTENSE" ||
    pain === "PAIN_STRONG" ||
    energy === "ENERGY_EXHAUSTED" ||
    symptoms === "SYM_MULTIPLOS" ||
    safety === "SAFETY_NAO" ||
    safety === "SAFETY_DUVIDA" ||
    discomfort === "DISCONFORTO_SIM";

  if (isRest) {
    return {
      path: "RECUPERAR" as const,
      isGoodDayForExercise: false,
      recommendedExerciseType: "Recuperação e descanso ativo",
      score: "20",
    };
  }

  const hasSymptoms = symptoms && symptoms !== "SYM_NENHUM";
  const treatmentDemanding =
    treatmentDay === "TREATMENT_QUIMIO" ||
    treatmentDay === "TREATMENT_RADIO" ||
    treatmentDay === "TREATMENT_HORMONIO" ||
    treatmentDay === "TREATMENT_POS_CIRURGICO";

  const emotionalSensitive =
    emotional === "EMO_ANSI" ||
    emotional === "EMO_TRISTE" ||
    emotional === "EMO_MUITO_ABALADA";

  const isAdapt =
    fatigue === "FATIGUE_MODERATE" ||
    pain === "PAIN_MODERATE" ||
    treatmentDemanding ||
    sleep === "SLEEP_MEH" ||
    sleep === "SLEEP_NAO" ||
    emotionalSensitive ||
    hasSymptoms ||
    safety === "SAFETY_POUCO";

  if (isAdapt) {
    return {
      path: "ADAPTAR" as const,
      isGoodDayForExercise: true,
      recommendedExerciseType: "Exercício adaptado (cadeira, mobilidade, respiração)",
      score: "50",
    };
  }

  return {
    path: "TREINAR" as const,
    isGoodDayForExercise: true,
    recommendedExerciseType: "Treinar hoje (força leve + cardio leve + mobilidade)",
    score: "80",
  };
}

export const responsesRouter = router({
  /**
   * Submit daily quiz response
   */
  submitDaily: patientProcedure
    .input(
      z.object({
        quizId: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            answerValue: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {

      // Check if patient already responded today
      const existingResponse = await getTodayResponse(ctx.user.id, input.quizId);
      if (existingResponse) {
        throw new Error(
          "You have already completed the quiz today. Please come back tomorrow!"
        );
      }

      // Get quiz with questions
      const quiz = await getQuizWithQuestions(input.quizId);
      if (!quiz) {
        throw new Error("Quiz not found");
      }

      // Map answers for decision logic
      const answersMap: Record<number, string> = {};
      for (const answer of input.answers) {
        answersMap[answer.questionId] = answer.answerValue;
      }

      const decision = determineDailyDecision(quiz.questions || [], answersMap);

      // Create response
      const responseData = {
        userId: ctx.user.id,
        quizId: input.quizId,
        responseDate: new Date(),
        totalScore: decision.score,
        isGoodDayForExercise: decision.isGoodDayForExercise,
        recommendedExerciseType: decision.recommendedExerciseType,
      };

      return await insertQuizResponse({
        ...responseData,
        recommendedIntensity: null,
        answers: [],
      });
    }),

  /**
   * Get patient's quiz response history
   */
  getMyHistory: publicProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      return await getPatientResponses(ctx.user.id, input.limit);
    }),

  /**
   * Get specific patient's history (admin only)
   */
  getPatientHistory: oncologistProcedure
    .input(
      z.object({
        patientId: z.number(),
        limit: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }) => {

      return await getPatientResponses(input.patientId, input.limit);
    }),

  /**
   * Get today's response for current patient
   */
  getToday: patientProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ input, ctx }) => {

      const response = await getTodayResponse(ctx.user.id, input.quizId);
      return response ?? null;
    }),
});
