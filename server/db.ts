import { PrismaClient, Prisma } from "@prisma/client";
import type {
  ExerciseIntensity,
  ExerciseTutorial,
  PatientProfile,
  Quiz,
  QuizQuestion,
  QuizQuestionOption,
  QuizQuestionType,
  QuizResponse,
  QuizResponseAnswer,
  QuizScoringConfig,
  User,
  UserRole,
} from "../shared/types";

declare global {
  // eslint-disable-next-line no-var
  var __oncolivingPrismaClient: PrismaClient | undefined;
}

const isTest = process.env.NODE_ENV === "test";

// Initialize Prisma Client
// Note: Prisma 7 uses direct connection via DATABASE_URL in prisma.config.ts
export function getPrisma(): PrismaClient {
  if (!globalThis.__oncolivingPrismaClient) {
    if (process.env.DATABASE_URL) {
      console.log(`DEBUG: Prisma INIT with DB URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ":***@")}`);
    } else {
      console.log("DEBUG: Prisma INIT - DATABASE_URL is undefined!");
    }
    globalThis.__oncolivingPrismaClient = new PrismaClient({
      log: isTest ? [] : ["error", "warn"],
    });
  }
  return globalThis.__oncolivingPrismaClient;
}

const prisma = getPrisma();

// Helper to get current date
function nowDates() {
  const now = new Date();
  return { now };
}

// Helper to normalize email
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  return user as User | null;
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user as User | null;
}

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { openId },
  });
  return user as User | null;
}

export async function createUser(input: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  loginMethod: string;
  hasActivePlan: boolean;
  hasCompletedAnamnesis: boolean;
  planType?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      openId: input.openId,
      email: normalizeEmail(input.email),
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role,
      loginMethod: input.loginMethod,
      hasActivePlan: input.hasActivePlan,
      hasCompletedAnamnesis: input.hasCompletedAnamnesis,
      planType: input.planType ?? null,
      asaasCustomerId: input.asaasCustomerId ?? null,
      asaasSubscriptionId: input.asaasSubscriptionId ?? null,
    },
  });
  return user as User;
}

export async function updateUserById(
  id: number,
  update: Partial<Pick<User, "name" | "hasActivePlan" | "hasCompletedAnamnesis" | "lastSignedIn" | "planType" | "asaasCustomerId" | "asaasSubscriptionId" | "cpfCnpj" | "mobilePhone" | "postalCode" | "address" | "addressNumber" | "province">>
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      ...update,
      updatedAt: new Date(),
    },
  });
}

// ============================================================================
// PATIENT PROFILE FUNCTIONS
// ============================================================================

export async function getPatientProfileByUserId(userId: number): Promise<PatientProfile | null> {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
  });
  return profile as PatientProfile | null;
}

export async function createPatientProfile(input: {
  userId: number;
  mainDiagnosis?: string | null;
  treatmentStage?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  observations?: unknown | null;
}): Promise<PatientProfile> {
  const profile = await prisma.patientProfile.create({
    data: {
      userId: input.userId,
      mainDiagnosis: input.mainDiagnosis ?? null,
      treatmentStage: input.treatmentStage ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      observations: (input.observations as any) ?? null,
    },
  });
  return profile as PatientProfile;
}

export async function updatePatientProfile(
  userId: number,
  update: Partial<Omit<PatientProfile, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const data = {
    mainDiagnosis: update.mainDiagnosis ?? null,
    treatmentStage: update.treatmentStage ?? null,
    dateOfBirth: update.dateOfBirth ?? null,
    gender: update.gender ?? null,
    observations: update.observations ?? Prisma.JsonNull,
  };

  // Filter out undefined values to allow partial updates without overwriting with nulls if not intended
  // Actually, for upsert 'create', we need values. For 'update', undefined means 'do not touch'.
  // But here we are constructing a data object.
  // The input 'update' comes from partial inputs.

  // Refined approach: pass 'update' directly if keys match.
  // But we need to handle generic object type safely.

  await prisma.patientProfile.upsert({
    where: { userId },
    update: {
      ...update,
      observations: update.observations !== undefined ? (update.observations as any) : undefined,
      updatedAt: new Date(),
    },
    create: {
      userId,
      ...update,
    } as any, // detailed casting not needed as update matches shape mostly
  });
}

// ============================================================================
// QUIZ FUNCTIONS
// ============================================================================

export async function getAllQuizzes(): Promise<Quiz[]> {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: "asc" },
      },
      scoringConfigs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return quizzes.map(quiz => ({
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      questionType: q.questionType as QuizQuestionType,
      weight: q.weight.toString(),
      options: q.options.map(opt => ({
        ...opt,
        scoreValue: opt.scoreValue.toString(),
      })),
    })),
    scoringConfig: quiz.scoringConfigs.map(sc => ({
      ...sc,
      minScore: sc.minScore.toString(),
      maxScore: sc.maxScore.toString(),
    })),
  })) as Quiz[];
}

export async function getQuizById(id: number): Promise<Quiz | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: "asc" },
      },
      scoringConfigs: true,
    },
  });

  if (!quiz) return null;

  return {
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      questionType: q.questionType as QuizQuestionType,
      weight: q.weight.toString(),
      options: q.options.map(opt => ({
        ...opt,
        scoreValue: opt.scoreValue.toString(),
      })),
    })),
    scoringConfig: quiz.scoringConfigs.map(sc => ({
      ...sc,
      minScore: sc.minScore.toString(),
      maxScore: sc.maxScore.toString(),
    })),
  } as Quiz;
}

export async function createQuiz(input: {
  name: string;
  description?: string | null;
  isActive: boolean;
  createdBy?: number | null;
}): Promise<Quiz> {
  const quiz = await prisma.quiz.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive,
      createdBy: input.createdBy ?? null,
    },
  });
  return quiz as Quiz;
}

export async function createQuizQuestion(input: {
  quizId: number;
  text: string;
  questionType: QuizQuestionType;
  weight: string;
  order: number;
}): Promise<QuizQuestion> {
  const question = await prisma.quizQuestion.create({
    data: {
      quizId: input.quizId,
      text: input.text,
      questionType: input.questionType,
      weight: parseFloat(input.weight),
      order: input.order,
    },
  });
  return {
    ...question,
    weight: question.weight.toString(),
    options: [],
  } as QuizQuestion;
}

export async function createQuestionOption(input: {
  questionId: number;
  text: string;
  scoreValue: string;
  order: number;
}): Promise<QuizQuestionOption> {
  const option = await prisma.questionOption.create({
    data: {
      questionId: input.questionId,
      text: input.text,
      scoreValue: parseFloat(input.scoreValue),
      order: input.order,
    },
  });
  return {
    ...option,
    scoreValue: option.scoreValue.toString(),
  } as QuizQuestionOption;
}

export async function createScoringConfig(input: {
  quizId: number;
  minScore: string;
  maxScore: string;
  isGoodDay: boolean;
  recommendedExerciseType: string;
  exerciseDescription?: string | null;
}): Promise<QuizScoringConfig> {
  const config = await prisma.quizScoringConfig.create({
    data: {
      quizId: input.quizId,
      minScore: parseFloat(input.minScore),
      maxScore: parseFloat(input.maxScore),
      isGoodDay: input.isGoodDay,
      recommendedExerciseType: input.recommendedExerciseType,
      exerciseDescription: input.exerciseDescription ?? null,
    },
  });
  return {
    ...config,
    minScore: config.minScore.toString(),
    maxScore: config.maxScore.toString(),
  } as QuizScoringConfig;
}

// ============================================================================
// QUIZ RESPONSE FUNCTIONS
// ============================================================================

export async function createQuizResponse(input: {
  userId: number;
  quizId: number;
  totalScore: string;
  isGoodDayForExercise: boolean;
  recommendedExerciseType: string;
  generalObservations?: string | null;
}): Promise<QuizResponse> {
  const response = await prisma.quizResponse.create({
    data: {
      userId: input.userId,
      quizId: input.quizId,
      totalScore: parseFloat(input.totalScore),
      isGoodDayForExercise: input.isGoodDayForExercise,
      recommendedExerciseType: input.recommendedExerciseType,
      generalObservations: input.generalObservations ?? null,
    },
  });
  return {
    ...response,
    totalScore: response.totalScore.toString(),
    answers: [],
  } as QuizResponse;
}

export async function createResponseAnswer(input: {
  responseId: number;
  questionId: number;
  answerValue: string;
}): Promise<QuizResponseAnswer> {
  const answer = await prisma.responseAnswer.create({
    data: {
      responseId: input.responseId,
      questionId: input.questionId,
      answerValue: input.answerValue,
    },
  });
  return answer as QuizResponseAnswer;
}

export async function getQuizResponsesByUserId(userId: number): Promise<QuizResponse[]> {
  const responses = await prisma.quizResponse.findMany({
    where: { userId },
    include: {
      answers: true,
    },
    orderBy: { responseDate: "desc" },
  });

  return responses.map(r => ({
    ...r,
    totalScore: r.totalScore.toString(),
  })) as QuizResponse[];
}

export async function getQuizResponseById(id: number): Promise<QuizResponse | null> {
  const response = await prisma.quizResponse.findUnique({
    where: { id },
    include: {
      answers: true,
    },
  });

  if (!response) return null;

  return {
    ...response,
    totalScore: response.totalScore.toString(),
  } as QuizResponse;
}

// ============================================================================
// EXERCISE TUTORIAL FUNCTIONS
// ============================================================================

export async function getAllExerciseTutorials(): Promise<ExerciseTutorial[]> {
  const tutorials = await prisma.exerciseTutorial.findMany({
    orderBy: { createdAt: "desc" },
  });
  return tutorials as ExerciseTutorial[];
}

export async function getExerciseTutorialById(id: number): Promise<ExerciseTutorial | null> {
  const tutorial = await prisma.exerciseTutorial.findUnique({
    where: { id },
  });
  return tutorial as ExerciseTutorial | null;
}

export async function createExerciseTutorial(input: {
  name: string;
  description?: string | null;
  intensityLevel: ExerciseIntensity;
  safetyGuidelines?: string | null;
  videoLink?: string | null;
}): Promise<ExerciseTutorial> {
  const tutorial = await prisma.exerciseTutorial.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      intensityLevel: input.intensityLevel,
      safetyGuidelines: input.safetyGuidelines ?? null,
      videoLink: input.videoLink ?? null,
    },
  });
  return tutorial as ExerciseTutorial;
}

export async function updateExerciseTutorial(
  id: number,
  update: Partial<Omit<ExerciseTutorial, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await prisma.exerciseTutorial.update({
    where: { id },
    data: {
      ...update,
      updatedAt: new Date(),
    },
  });
}

export async function deleteExerciseTutorial(id: number): Promise<void> {
  await prisma.exerciseTutorial.delete({
    where: { id },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

// For backward compatibility with tests
export async function getDb() {
  return prisma;
}

// ============================================================================
// LEGACY/HELPER FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================================================

export async function getAllPatients(): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { createdAt: "desc" },
  });
  return users as User[];
}

export async function getPatientProfile(userId: number): Promise<PatientProfile | null> {
  return getPatientProfileByUserId(userId);
}

export async function getActiveQuiz(): Promise<Quiz | null> {
  const quiz = await prisma.quiz.findFirst({
    where: { isActive: true },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: "asc" },
      },
      scoringConfigs: true,
    },
  });

  if (!quiz) return null;

  return {
    ...quiz,
    questions: quiz.questions.map((q: any) => ({
      ...q,
      questionType: q.questionType as QuizQuestionType,
      weight: q.weight.toString(),
      options: q.options.map((opt: any) => ({
        ...opt,
        scoreValue: opt.scoreValue.toString(),
      })),
    })),
    scoringConfig: quiz.scoringConfigs.map((sc: any) => ({
      ...sc,
      minScore: sc.minScore.toString(),
      maxScore: sc.maxScore.toString(),
    })),
  } as Quiz;
}

export async function getQuizWithQuestions(quizId: number): Promise<Quiz | null> {
  return getQuizById(quizId);
}

export async function ensureBaselineQuizQuestions(): Promise<void> {
  // This function is no longer needed with Prisma migrations
  // Baseline data should be created via migrations or seed scripts
  return;
}

export async function updateQuizById(
  id: number,
  update: Partial<Omit<Quiz, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await prisma.quiz.update({
    where: { id },
    data: {
      description: update.description ?? undefined,
      isActive: update.isActive ?? undefined,
      createdBy: update.createdBy ?? undefined,
      updatedAt: new Date(),
    },
  });
}

export async function getAllExercises(): Promise<ExerciseTutorial[]> {
  return getAllExerciseTutorials();
}

export async function updateQuizQuestionById(
  id: number,
  update: Partial<Omit<QuizQuestion, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await prisma.quizQuestion.update({
    where: { id },
    data: {
      text: update.text ?? undefined,
      questionType: update.questionType ?? undefined,
      weight: update.weight ? parseFloat(update.weight) : undefined,
      order: update.order ?? undefined,
      updatedAt: new Date(),
    },
  });
}

export async function deleteQuizQuestionById(id: number): Promise<void> {
  await prisma.quizQuestion.delete({
    where: { id },
  });
}

export async function getTodayResponse(userId: number, quizId?: number): Promise<QuizResponse | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where: any = {
    userId,
    responseDate: {
      gte: today,
      lt: tomorrow,
    },
  };

  if (quizId) {
    where.quizId = quizId;
  }

  const response = await prisma.quizResponse.findFirst({
    where,
    include: {
      answers: true,
    },
  });

  if (!response) return null;

  return {
    ...response,
    totalScore: response.totalScore.toString(),
    answers: response.answers.map((a: any) => ({
      ...a,
      scoreValue: a.scoreValue.toString(),
    })),
  } as QuizResponse;
}

export async function getPatientResponses(userId: number, limit?: number): Promise<QuizResponse[]> {
  const responses = await prisma.quizResponse.findMany({
    where: { userId },
    take: limit,
    include: {
      answers: true,
      quiz: {
        include: {
          questions: {
            include: {
              options: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { responseDate: "desc" },
  });

  return responses.map(r => ({
    ...r,
    totalScore: r.totalScore.toString(),
    quiz: {
      ...r.quiz,
      questions: r.quiz.questions.map((q: any) => ({
        ...q,
        questionType: q.questionType as QuizQuestionType,
        weight: q.weight.toString(),
        options: q.options.map((opt: any) => ({
          ...opt,
          scoreValue: opt.scoreValue.toString(),
        })),
      })),
    },
  })) as any[]; // Using any[] to bypass strict typing for now, ideally strictly typed

}

export async function insertQuizResponse(input: {
  userId: number;
  quizId: number;
  totalScore: string;
  isGoodDayForExercise: boolean;
  recommendedIntensity: ExerciseIntensity | null;
  recommendedExerciseType?: string;
  answers: Array<{
    questionId: number;
    selectedOptionId: number | null;
    textAnswer: string | null;
    scoreValue: string;
  }>;
}): Promise<QuizResponse> {
  return createQuizResponse({
    ...input,
    recommendedExerciseType: input.recommendedExerciseType || (input.recommendedIntensity || "NONE"),
  });
}
export async function getScoringConfigForQuiz(quizId: number): Promise<QuizScoringConfig[]> {
  const configs = await prisma.quizScoringConfig.findMany({
    where: { quizId },
  });
  return configs.map(c => ({
    ...c,
    minScore: c.minScore.toString(),
    maxScore: c.maxScore.toString(),
  })) as QuizScoringConfig[];
}

export async function getExercisesByIntensity(
  intensity: ExerciseIntensity
): Promise<ExerciseTutorial[]> {
  const exercises = await prisma.exerciseTutorial.findMany({
    where: { intensityLevel: intensity },
    orderBy: { createdAt: "desc" },
  });
  return exercises as ExerciseTutorial[];
}

export async function updateExerciseTutorialById(
  id: number,
  update: Partial<Omit<ExerciseTutorial, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  return updateExerciseTutorial(id, update);
}

export async function deleteExerciseTutorialById(id: number): Promise<void> {
  return deleteExerciseTutorial(id);
}

// Health Tracking Methods

export async function addWaterIntake(userId: number, amountMl: number): Promise<DailyHydration> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  return await prisma.dailyHydration.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      currentIntakeMl: { increment: amountMl },
    },
    create: {
      userId,
      date: today,
      currentIntakeMl: amountMl,
      dailyGoalMl: 2000, // Default goal
    },
  });
}

export async function getTodayHydration(userId: number): Promise<DailyHydration | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.dailyHydration.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });
}

export async function logSymptom(userId: number, input: { symptom: string, intensity: number, notes?: string | null }) {
  return await prisma.symptomLog.create({
    data: {
      userId,
      symptom: input.symptom,
      intensity: input.intensity,
      notes: input.notes,
    },
  });
}

export async function getRecentSymptoms(userId: number, limit = 20) {
  return await prisma.symptomLog.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}
