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
    return answers[q.id]; // This will be the OPTION VALUE (e.g., "FATIGUE_INTENSE") because the seed sets value
  };

  // Answers Map based on Seed Order
  // 1: Energy (ENERGY_GOOD...EXHAUSTED)
  // 2: Fatigue (NONE...INTENSE)
  // 3: Pain (NONE...STRONG)
  // 4: Symptoms (Multi - comma separated or simple string)
  // 5: Treatment Day (NO...SURGERY)
  // 6: Sleep (GOOD...BAD)
  // 7: Emotional (CALM...SHAKEN)
  // 8: Safety (YES...NO)

  const energy = byOrder(1);
  const fatigue = byOrder(2);
  const pain = byOrder(3);
  const symptoms = byOrder(4);
  const treatmentDay = byOrder(5);
  const sleep = byOrder(6);
  const emotional = byOrder(7);
  const safety = byOrder(8);

  // --- PATH 3: RECUPERAR (Blue) ---
  // Se: fadiga intensa OR dor forte OR exaustão OR múltiplos sintomas (simulated) OR insegurança
  const isRecover = 
    fatigue === "FATIGUE_INTENSE" ||
    pain === "PAIN_STRONG" ||
    energy === "ENERGY_EXHAUSTED" || 
    energy === "ENERGY_VERY_TIRED" || // Adding Very Tired to recover/adapt boundary
    safety === "SAFETY_NO" ||
    safety === "SAFETY_UNSURE" ||
    emotional === "EMO_SHAKEN";

  if (isRecover) {
    return {
      path: "RECUPERAR" as const, // For frontend reference
      isGoodDayForExercise: false,
      recommendedExerciseType: "Recuperação / Yoga",
      // Video link placeholders as requested by logic blocks
      videoUrl: "https://www.youtube.com/playlist?list=PLPlaceholderRecover",
      score: "30",
      message: "Hoje o melhor cuidado é respeitar seu corpo. O movimento de hoje é descanso ativo e respiração."
    };
  }

  // --- PATH 2: ADAPTAR (Yellow) ---
  // Se: fadiga moderada OR dor moderada OR dia de tratamento OR sono ruim
  const treatmentActive =
    treatmentDay === "TREATMENT_CHEMO" ||
    treatmentDay === "TREATMENT_RADIO" ||
    treatmentDay === "TREATMENT_HORMONE" || // Hormone usually mild, but let's keep it careful
    treatmentDay === "TREATMENT_SURGERY";

  const isAdapt = 
    fatigue === "FATIGUE_MODERATE" ||
    pain === "PAIN_MODERATE" ||
    treatmentActive ||
    sleep === "SLEEP_BAD" ||
    emotional === "EMO_ANXIOUS" ||
    emotional === "EMO_SAD" ||
    (symptoms && symptoms !== "SYM_NONE" && symptoms !== "SYM_NAUSEA"); // Mild symptoms

  if (isAdapt) {
    return {
      path: "ADAPTAR" as const,
      isGoodDayForExercise: true,
      recommendedExerciseType: "Exercício Adaptado",
      videoUrl: "https://www.youtube.com/playlist?list=PLPlaceholderAdapt",
      score: "60",
      message: "Hoje seu corpo pede cuidado. O movimento de hoje será leve, respeitando seu momento."
    };
  }

  // --- PATH 1: TREINAR (Green) ---
  // Default if not Recover or Adapt
  return {
    path: "TREINAR" as const,
    isGoodDayForExercise: true,
    recommendedExerciseType: "Treino Completo",
    videoUrl: "https://www.youtube.com/playlist?list=PLPlaceholderTrain",
    score: "100",
    message: "Hoje seu corpo permite movimento com segurança. Preparamos um exercício adequado para você."
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
      // map answers
      const answersMap: Record<number, string> = {};
      for (const answer of input.answers) {
        answersMap[answer.questionId] = answer.answerValue;
      }

      let responseData: any = {
        userId: ctx.user.id,
        quizId: input.quizId,
        responseDate: new Date(),
        answers: [],
      };

      // LOGIC BRANCHING
      if (input.quizId === 2) {
        // --- INTRO QUIZ (Avaliação Inicial) ---
        // Just save responses, return generic "Assessment Complete"
        responseData = {
          ...responseData,
          totalScore: 0,
          isGoodDayForExercise: true, // Always positive for sales flow
          recommendedExerciseType: "INTRO_COMPLETED",
          generalObservations: "Avaliação inicial completada.",
        };
      } else {
        // --- DAILY CHECK-IN (Quiz 1) ---
        const decision = determineDailyDecision(quiz.questions || [], answersMap);

        responseData = {
          ...responseData,
          totalScore: decision.score,
          isGoodDayForExercise: decision.isGoodDayForExercise,
          recommendedExerciseType: decision.recommendedExerciseType,
        };
      }

      return await insertQuizResponse({
        ...responseData,
        recommendedIntensity: null,
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
