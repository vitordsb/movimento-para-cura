import { MongoClient, type Db } from "mongodb";
import { ENV } from "./config/env";
import type {
  ExerciseIntensity,
  ExerciseTutorial,
  PatientProfile,
  Quiz,
  QuizQuestion,
  QuizQuestionOption,
  QuizResponse,
  QuizScoringConfig,
  User,
  UserRole,
} from "../shared/types";

declare global {
  // eslint-disable-next-line no-var
  var __oncolivingMongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __oncolivingMongoIndexesPromise: Promise<void> | undefined;
}

const isTest = process.env.NODE_ENV === "test";

// Minimal in-memory stubs used by unit tests when no DB is configured.
const testPatientProfiles = new Map<number, PatientProfile>();
const testUsersById: Record<number, User> = {
  2: {
    id: 2,
    openId: "patient-test-2",
    email: "patient2@test.local",
    name: "Test Patient 2",
    passwordHash: null,
    role: "PATIENT",
    loginMethod: "local",
    hasActivePlan: false,
    hasCompletedAnamnesis: false,
    planType: "TEST",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
};

function resolveDbNameFromUri(uri: string) {
  try {
    const url = new URL(uri);
    const pathname = url.pathname?.replace(/^\//, "") ?? "";
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

export async function getDb(): Promise<Db | null> {
  if (!ENV.mongoUri) return null;

  if (!globalThis.__oncolivingMongoClientPromise) {
    const client = new MongoClient(ENV.mongoUri);
    globalThis.__oncolivingMongoClientPromise = client.connect();
  }

  const client = await globalThis.__oncolivingMongoClientPromise;
  const dbName = ENV.mongoDbName || resolveDbNameFromUri(ENV.mongoUri) || "oncoliving";
  const db = client.db(dbName);

  if (!globalThis.__oncolivingMongoIndexesPromise) {
    globalThis.__oncolivingMongoIndexesPromise = ensureMongoIndexes(db);
  }
  await globalThis.__oncolivingMongoIndexesPromise;

  return db;
}

async function ensureMongoIndexes(db: Db) {
  const safeCreate = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (error) {
      console.warn("[Database] Failed to create index:", error);
    }
  };

  await safeCreate(() => db.collection("users").createIndex({ id: 1 }, { unique: true }));
  await safeCreate(() => db.collection("users").createIndex({ email: 1 }, { unique: true }));
  await safeCreate(() => db.collection("users").createIndex({ openId: 1 }, { unique: true }));

  await safeCreate(() => db.collection("patient_profiles").createIndex({ id: 1 }, { unique: true }));
  await safeCreate(() => db.collection("patient_profiles").createIndex({ userId: 1 }, { unique: true }));

  await safeCreate(() => db.collection("quizzes").createIndex({ id: 1 }, { unique: true }));
  await safeCreate(() => db.collection("quizzes").createIndex({ isActive: 1 }));

  await safeCreate(() => db.collection("quiz_responses").createIndex({ id: 1 }, { unique: true }));
  await safeCreate(() =>
    db.collection("quiz_responses").createIndex({ userId: 1, quizId: 1, responseDate: -1 })
  );

  await safeCreate(() => db.collection("exercise_tutorials").createIndex({ id: 1 }, { unique: true }));
  await safeCreate(() => db.collection("exercise_tutorials").createIndex({ intensityLevel: 1 }));
}

async function getNextId(db: Db, sequenceName: string): Promise<number> {
  const result = await db.collection<{ _id: string; seq: number }>("counters").findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return result?.seq ?? 1;
}

function nowDates() {
  const now = new Date();
  return { now, now2: now }; // avoid double Date allocations on hot paths
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const user = await db.collection<User>("users").findOne({ openId }, { projection: { _id: 0 } as any });
  return user ?? undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const normalized = normalizeEmail(email);
  const user = await db
    .collection<User>("users")
    .findOne({ email: normalized }, { projection: { _id: 0 } as any });
  return user ?? undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    if (isTest) return testUsersById[id];
    return undefined;
  }

  const user = await db.collection<User>("users").findOne({ id }, { projection: { _id: 0 } as any });
  return user ?? undefined;
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { now } = nowDates();
  const id = await getNextId(db, "users");
  const user: User = {
    id,
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
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };

  await db.collection<User>("users").insertOne(user as any);
  return user;
}

export async function updateUserById(
  id: number,
  update: Partial<Pick<User, "name" | "hasActivePlan" | "hasCompletedAnamnesis" | "lastSignedIn" | "planType" | "asaasCustomerId" | "asaasSubscriptionId">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { now } = nowDates();
  await db.collection<User>("users").updateOne(
    { id },
    {
      $set: {
        ...update,
        updatedAt: now,
      },
    }
  );
}

/**
 * Patient-related queries
 */
export async function getPatientProfile(userId: number): Promise<PatientProfile | undefined> {
  const db = await getDb();
  if (!db) {
    if (isTest) return testPatientProfiles.get(userId);
    return undefined;
  }

  const profile = await db
    .collection<PatientProfile>("patient_profiles")
    .findOne({ userId }, { projection: { _id: 0 } as any });
  return profile ?? undefined;
}

export async function getAllPatients(): Promise<Array<Pick<User, "id" | "name" | "email" | "createdAt">>> {
  const db = await getDb();
  if (!db) return [];

  const patients = await db
    .collection<User>("users")
    .find({ role: "PATIENT" })
    .project({ _id: 0, id: 1, name: 1, email: 1, createdAt: 1 })
    .toArray();

  return patients as any;
}

export async function updatePatientProfile(
  userId: number,
  data: Partial<Pick<PatientProfile, "mainDiagnosis" | "treatmentStage" | "dateOfBirth" | "gender" | "observations">>
): Promise<PatientProfile | undefined> {
  const db = await getDb();
  if (!db) {
    if (isTest) {
      const existing = testPatientProfiles.get(userId);
      const { now } = nowDates();
      const next: PatientProfile = {
        id: existing?.id ?? 1,
        userId,
        mainDiagnosis: existing?.mainDiagnosis ?? null,
        treatmentStage: existing?.treatmentStage ?? null,
        dateOfBirth: existing?.dateOfBirth ?? null,
        gender: existing?.gender ?? null,
        observations: existing?.observations ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        ...data,
      } as any;
      testPatientProfiles.set(userId, next);
      return next;
    }
    return undefined;
  }

  const existing = await getPatientProfile(userId);
  const { now } = nowDates();

  if (!existing) {
    const id = await getNextId(db, "patient_profiles");
    const created: PatientProfile = {
      id,
      userId,
      mainDiagnosis: data.mainDiagnosis ?? null,
      treatmentStage: data.treatmentStage ?? null,
      dateOfBirth: (data.dateOfBirth as any) ?? null,
      gender: data.gender ?? null,
      observations: (data.observations as any) ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<PatientProfile>("patient_profiles").insertOne(created as any);
    return created;
  }

  await db.collection<PatientProfile>("patient_profiles").updateOne(
    { userId },
    {
      $set: {
        ...data,
        updatedAt: now,
      },
    }
  );

  return await getPatientProfile(userId);
}

/**
 * Quiz-related queries
 */
export async function getActiveQuiz(): Promise<Quiz | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  let quiz = (await db
    .collection<Quiz>("quizzes")
    .findOne({ isActive: true }, { projection: { _id: 0 } as any })) as unknown as Quiz | null;
  if (quiz) return quiz;

  // Auto-create a default active quiz so the app works out-of-the-box.
  quiz = await createDefaultQuiz(db);
  return quiz;
}

export async function getQuizById(quizId: number): Promise<Quiz | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const quiz = await db.collection<Quiz>("quizzes").findOne({ id: quizId }, { projection: { _id: 0 } as any });
  return quiz ?? undefined;
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const db = await getDb();
  if (!db) return [];

  const quizzes = await db.collection<Quiz>("quizzes").find({}).project({ _id: 0 }).toArray();
  return quizzes as any;
}

export async function createQuiz(input: {
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: number;
}): Promise<Quiz> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { now } = nowDates();
  const id = await getNextId(db, "quizzes");

  if (input.isActive) {
    await db
      .collection<Quiz>("quizzes")
      .updateMany({ isActive: true }, { $set: { isActive: false, updatedAt: now } as any });
  }

  const quiz: Quiz = {
    id,
    name: input.name,
    description: input.description ?? null,
    isActive: input.isActive,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    questions: [],
    scoringConfig: [],
  };

  await db.collection<Quiz>("quizzes").insertOne(quiz as any);
  return quiz;
}

export async function updateQuizById(
  quizId: number,
  update: Partial<Pick<Quiz, "name" | "description" | "isActive">>
): Promise<Quiz | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const { now } = nowDates();

  if (update.isActive === true) {
    await db.collection<Quiz>("quizzes").updateMany(
      { id: { $ne: quizId } as any, isActive: true },
      { $set: { isActive: false, updatedAt: now } as any }
    );
  }

  const set: Record<string, unknown> = { updatedAt: now };
  if (update.name !== undefined) set.name = update.name;
  if (update.description !== undefined) set.description = update.description;
  if (update.isActive !== undefined) set.isActive = update.isActive;

  const result = await db.collection<Quiz>("quizzes").updateOne({ id: quizId }, { $set: set as any });
  if (!result.matchedCount) return undefined;

  return await getQuizById(quizId);
}

export async function createQuizQuestion(input: {
  quizId: number;
  text: string;
  questionType: QuizQuestion["questionType"];
  weight: string;
  order: number;
}): Promise<QuizQuestion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { now } = nowDates();
  const id = await getNextId(db, "quiz_questions");
  const question: QuizQuestion = {
    id,
    quizId: input.quizId,
    text: input.text,
    questionType: input.questionType,
    weight: input.weight,
    order: input.order,
    options: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<Quiz>("quizzes").updateOne(
    { id: input.quizId },
    {
      $push: { questions: question as any },
      $set: { updatedAt: now } as any,
    }
  );

  if (!result.matchedCount) {
    throw new Error("Quiz not found");
  }

  return question;
}

export async function updateQuizQuestionById(
  questionId: number,
  update: Partial<Pick<QuizQuestion, "text" | "weight" | "order">>
): Promise<QuizQuestion | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const { now } = nowDates();
  const set: Record<string, unknown> = {
    updatedAt: now,
    "questions.$.updatedAt": now,
  };
  if (update.text !== undefined) set["questions.$.text"] = update.text;
  if (update.weight !== undefined) set["questions.$.weight"] = update.weight;
  if (update.order !== undefined) set["questions.$.order"] = update.order;

  const result = await db
    .collection<Quiz>("quizzes")
    .updateOne({ "questions.id": questionId } as any, { $set: set as any });

  if (!result.matchedCount) return undefined;

  const quiz = await db
    .collection<Pick<Quiz, "questions">>("quizzes")
    .findOne({ "questions.id": questionId } as any, { projection: { _id: 0, questions: 1 } as any });

  return quiz?.questions?.find((q: QuizQuestion) => q.id === questionId);
}

export async function deleteQuizQuestionById(questionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const { now } = nowDates();
  const result = await db.collection<Quiz>("quizzes").updateOne(
    { "questions.id": questionId } as any,
    {
      $pull: { questions: { id: questionId } as any },
      $set: { updatedAt: now } as any,
    }
  );

  return result.modifiedCount > 0;
}

export async function getQuizWithQuestions(quizId: number): Promise<(Quiz & { questions: QuizQuestion[] }) | undefined> {
  const quiz = await getQuizById(quizId);
  if (!quiz) return undefined;

  const questions = (quiz.questions ?? []).slice().sort((a, b) => a.order - b.order).map((q) => ({
    ...q,
    options: (q.options ?? []).slice().sort((a, b) => a.order - b.order),
  }));

  return { ...quiz, questions };
}

type DefaultQuestion = {
  text: string;
  questionType: "YES_NO" | "SCALE_0_10" | "MULTIPLE_CHOICE";
  weight: string;
  order: number;
  options?: { text: string; scoreValue: string; order: number }[];
};

const BASELINE_QUESTIONS: DefaultQuestion[] = [
  {
    text: "Como está sua energia hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 1,
    options: [
      { text: "Estou bem / com energia", scoreValue: "ENERGY_GOOD", order: 1 },
      { text: "Um pouco cansada", scoreValue: "ENERGY_SOMEWHAT_TIRED", order: 2 },
      { text: "Muito cansada", scoreValue: "ENERGY_VERY_TIRED", order: 3 },
      { text: "Exausta", scoreValue: "ENERGY_EXHAUSTED", order: 4 },
    ],
  },
  {
    text: "Você sente fadiga agora?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 2,
    options: [
      { text: "Não", scoreValue: "FATIGUE_NONE", order: 1 },
      { text: "Leve", scoreValue: "FATIGUE_LIGHT", order: 2 },
      { text: "Moderada", scoreValue: "FATIGUE_MODERATE", order: 3 },
      { text: "Intensa", scoreValue: "FATIGUE_INTENSE", order: 4 },
    ],
  },
  {
    text: "Como está sua dor hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 3,
    options: [
      { text: "Não estou com dor", scoreValue: "PAIN_NONE", order: 1 },
      { text: "Dor leve", scoreValue: "PAIN_LIGHT", order: 2 },
      { text: "Dor moderada", scoreValue: "PAIN_MODERATE", order: 3 },
      { text: "Dor forte", scoreValue: "PAIN_STRONG", order: 4 },
    ],
  },
  {
    text: "Você teve algum desses sintomas hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 4,
    options: [
      { text: "Náusea / enjoo", scoreValue: "SYM_NAUSEA", order: 1 },
      { text: "Tontura", scoreValue: "SYM_TONTURA", order: 2 },
      { text: "Falta de ar", scoreValue: "SYM_FALTA_AR", order: 3 },
      { text: "Dor de cabeça", scoreValue: "SYM_DOR_CABECA", order: 4 },
      { text: "Diarreia", scoreValue: "SYM_DIARREIA", order: 5 },
      { text: "Mais de um dos acima", scoreValue: "SYM_MULTIPLOS", order: 6 },
      { text: "Nenhum desses", scoreValue: "SYM_NENHUM", order: 7 },
    ],
  },
  {
    text: "Hoje é dia de tratamento?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 5,
    options: [
      { text: "Não", scoreValue: "TREATMENT_NONE", order: 1 },
      { text: "Sim, fiz quimioterapia hoje", scoreValue: "TREATMENT_QUIMIO", order: 2 },
      { text: "Sim, fiz radioterapia hoje", scoreValue: "TREATMENT_RADIO", order: 3 },
      { text: "Estou em hormonioterapia", scoreValue: "TREATMENT_HORMONIO", order: 4 },
      { text: "Estou em pós-cirúrgico recente", scoreValue: "TREATMENT_POS_CIRURGICO", order: 5 },
    ],
  },
  {
    text: "Você dormiu bem?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 6,
    options: [
      { text: "Sim", scoreValue: "SLEEP_SIM", order: 1 },
      { text: "Mais ou menos", scoreValue: "SLEEP_MEH", order: 2 },
      { text: "Não dormi bem", scoreValue: "SLEEP_NAO", order: 3 },
    ],
  },
  {
    text: "Como está seu emocional hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 7,
    options: [
      { text: "Tranquila", scoreValue: "EMO_TRANQUILA", order: 1 },
      { text: "Um pouco ansiosa", scoreValue: "EMO_ANSI", order: 2 },
      { text: "Triste / desanimada", scoreValue: "EMO_TRISTE", order: 3 },
      { text: "Muito abalada hoje", scoreValue: "EMO_MUITO_ABALADA", order: 4 },
    ],
  },
  {
    text: "Você sente segurança para se movimentar hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 8,
    options: [
      { text: "Sim", scoreValue: "SAFETY_SIM", order: 1 },
      { text: "Um pouco", scoreValue: "SAFETY_POUCO", order: 2 },
      { text: "Não tenho certeza", scoreValue: "SAFETY_DUVIDA", order: 3 },
      { text: "Não", scoreValue: "SAFETY_NAO", order: 4 },
    ],
  },
  {
    text: "Hoje você sente algum desconforto físico específico que te preocupa?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 9,
    options: [
      { text: "Não", scoreValue: "DISCONFORTO_NAO", order: 1 },
      { text: "Sim, estou com algum desconforto", scoreValue: "DISCONFORTO_SIM", order: 2 },
    ],
  },
  {
    text: "Você gostaria de ter um acompanhamento mais próximo e personalizado?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 10,
    options: [
      { text: "Sim, quero saber mais", scoreValue: "CONSULTORIA_SIM", order: 1 },
      { text: "Talvez no futuro", scoreValue: "CONSULTORIA_TALVEZ", order: 2 },
      { text: "Não por enquanto", scoreValue: "CONSULTORIA_NAO", order: 3 },
    ],
  },
];

const DEFAULT_SCORING: Array<
  Pick<
    QuizScoringConfig,
    "minScore" | "maxScore" | "isGoodDay" | "recommendedExerciseType" | "exerciseDescription"
  >
> = [
  {
    minScore: "0",
    maxScore: "33",
    isGoodDay: true,
    recommendedExerciseType: "Treinar hoje (força leve + cardio leve + mobilidade)",
    exerciseDescription: "Perfil liberado para movimento seguro, priorizando força leve, cardio leve e mobilidade.",
  },
  {
    minScore: "34",
    maxScore: "66",
    isGoodDay: true,
    recommendedExerciseType: "Exercício adaptado (cadeira, mobilidade, respiração)",
    exerciseDescription: "Dia de ajustar intensidade: movimentos sentados, mobilidade suave, alongamentos e respiração.",
  },
  {
    minScore: "67",
    maxScore: "100",
    isGoodDay: false,
    recommendedExerciseType: "Recuperação e descanso ativo",
    exerciseDescription: "Priorize descanso ativo, respiração e alongamentos leves; hoje é dia de recuperação.",
  },
];

async function createDefaultQuiz(db: Db): Promise<Quiz> {
  const { now } = nowDates();
  const quizId = await getNextId(db, "quizzes");

  const questions: QuizQuestion[] = [];
  for (const q of BASELINE_QUESTIONS) {
    const questionId = await getNextId(db, "quiz_questions");
    const options: QuizQuestionOption[] = [];
    if (q.options?.length) {
      for (const opt of q.options) {
        options.push({
          id: await getNextId(db, "quiz_question_options"),
          text: opt.text,
          scoreValue: opt.scoreValue,
          order: opt.order,
          createdAt: now,
        });
      }
    }

    questions.push({
      id: questionId,
      quizId,
      text: q.text,
      questionType: q.questionType,
      weight: q.weight,
      order: q.order,
      options,
      createdAt: now,
      updatedAt: now,
    });
  }

  const scoringConfig: QuizScoringConfig[] = [];
  for (const sc of DEFAULT_SCORING) {
    scoringConfig.push({
      id: await getNextId(db, "quiz_scoring_config"),
      quizId,
      minScore: sc.minScore,
      maxScore: sc.maxScore,
      isGoodDay: sc.isGoodDay,
      recommendedExerciseType: sc.recommendedExerciseType,
      exerciseDescription: sc.exerciseDescription ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const quiz: Quiz = {
    id: quizId,
    name: "Check-in do dia",
    description:
      "Avaliação diária para direcionar se é dia de treinar, adaptar ou recuperar com segurança",
    isActive: true,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
    questions,
    scoringConfig,
  };

  await db.collection<Quiz>("quizzes").insertOne(quiz as any);
  return quiz;
}

export async function ensureBaselineQuizQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return;

  const quiz = await getQuizById(quizId);
  if (!quiz) return;

  const baselineTexts = new Set(BASELINE_QUESTIONS.map((q) => q.text));
  const matchesBaseline =
    quiz.questions &&
    quiz.questions.length === BASELINE_QUESTIONS.length &&
    quiz.questions.every((q) => baselineTexts.has(q.text));

  if (matchesBaseline) return;

  const { now } = nowDates();
  const newQuestions: QuizQuestion[] = [];

  for (const q of BASELINE_QUESTIONS) {
    const questionId = await getNextId(db, "quiz_questions");
    const options: QuizQuestionOption[] = [];
    if (q.options?.length) {
      for (const opt of q.options) {
        options.push({
          id: await getNextId(db, "quiz_question_options"),
          text: opt.text,
          scoreValue: opt.scoreValue,
          order: opt.order,
          createdAt: now,
        });
      }
    }
    newQuestions.push({
      id: questionId,
      quizId,
      text: q.text,
      questionType: q.questionType,
      weight: q.weight,
      order: q.order,
      options,
      createdAt: now,
      updatedAt: now,
    });
  }

  const scoringConfig: QuizScoringConfig[] = [];
  for (const sc of DEFAULT_SCORING) {
    scoringConfig.push({
      id: await getNextId(db, "quiz_scoring_config"),
      quizId,
      minScore: sc.minScore,
      maxScore: sc.maxScore,
      isGoodDay: sc.isGoodDay,
      recommendedExerciseType: sc.recommendedExerciseType,
      exerciseDescription: sc.exerciseDescription ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection<Quiz>("quizzes").updateOne(
    { id: quizId },
    {
      $set: {
        questions: newQuestions,
        scoringConfig,
        updatedAt: now,
      },
    }
  );
}

export async function getScoringConfigForQuiz(quizId: number): Promise<QuizScoringConfig[]> {
  const quiz = await getQuizById(quizId);
  return (quiz?.scoringConfig ?? []) as any;
}

/**
 * Quiz Response queries
 */
export async function getTodayResponse(userId: number, quizId: number): Promise<QuizResponse | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const response = await db
    .collection<QuizResponse>("quiz_responses")
    .findOne({ userId, quizId, responseDate: { $gte: today } as any }, { projection: { _id: 0 } as any });

  return response ?? undefined;
}

export async function getPatientResponses(userId: number, limit: number = 30): Promise<QuizResponse[]> {
  const db = await getDb();
  if (!db) return [];

  const responses = await db
    .collection<QuizResponse>("quiz_responses")
    .find({ userId })
    .project({ _id: 0 })
    .sort({ responseDate: -1 })
    .limit(limit)
    .toArray();

  return responses as any;
}

export async function insertQuizResponse(input: Omit<QuizResponse, "id" | "createdAt" | "updatedAt">): Promise<QuizResponse> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { now } = nowDates();
  const id = await getNextId(db, "quiz_responses");
  const response: QuizResponse = {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<QuizResponse>("quiz_responses").insertOne(response as any);
  return response;
}

/**
 * Exercise queries
 */
const BASELINE_EXERCISES: Array<Omit<ExerciseTutorial, "id" | "createdAt" | "updatedAt">> = [
  {
    name: "Caminhada leve",
    description: "Caminhada confortável por 10–20 minutos, respeitando seus limites.",
    intensityLevel: "LIGHT",
    safetyGuidelines: "Hidrate-se. Pare se sentir tontura, falta de ar ou dor incomum.",
    videoLink: null,
  },
  {
    name: "Alongamento suave",
    description: "Alongamentos leves para mobilidade e rigidez (5–10 minutos).",
    intensityLevel: "LIGHT",
    safetyGuidelines: "Não force. Mantenha cada posição por 20–30 segundos.",
    videoLink: null,
  },
  {
    name: "Força leve (sentada)",
    description: "Exercícios com elástico leve ou peso do corpo, com pausas frequentes (8–12 min).",
    intensityLevel: "MODERATE",
    safetyGuidelines: "Priorize técnica. Interrompa se houver dor ou falta de ar intensa.",
    videoLink: null,
  },
  {
    name: "Cardio moderado controlado",
    description: "Marcha no lugar/caminhada com fala confortável (10–15 min).",
    intensityLevel: "MODERATE",
    safetyGuidelines: "Mantenha esforço leve/moderado e pare se sentir sintomas incomuns.",
    videoLink: null,
  },
  {
    name: "Circuito funcional (moderado)",
    description: "Sequência curta de força e mobilidade (10–15 min), sem impacto.",
    intensityLevel: "STRONG",
    safetyGuidelines: "Evite impacto. Faça pausas. Pare se houver dor, tontura ou falta de ar.",
    videoLink: null,
  },
];

async function ensureBaselineExercises(db: Db) {
  const count = await db.collection("exercise_tutorials").countDocuments();
  if (count > 0) return;

  const { now } = nowDates();
  const docs: ExerciseTutorial[] = [];
  for (const ex of BASELINE_EXERCISES) {
    docs.push({
      id: await getNextId(db, "exercise_tutorials"),
      ...ex,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (docs.length) {
    await db.collection<ExerciseTutorial>("exercise_tutorials").insertMany(docs as any);
  }
}

export async function getAllExercises(): Promise<ExerciseTutorial[]> {
  const db = await getDb();
  if (!db) return [];

  await ensureBaselineExercises(db);
  const exercises = await db.collection<ExerciseTutorial>("exercise_tutorials").find({}).project({ _id: 0 }).toArray();
  return exercises as any;
}

export async function getExercisesByIntensity(intensity: ExerciseIntensity): Promise<ExerciseTutorial[]> {
  const db = await getDb();
  if (!db) return [];

  await ensureBaselineExercises(db);
  const exercises = await db
    .collection<ExerciseTutorial>("exercise_tutorials")
    .find({ intensityLevel: intensity })
    .project({ _id: 0 })
    .toArray();

  return exercises as any;
}

export async function createExerciseTutorial(
  input: Omit<ExerciseTutorial, "id" | "createdAt" | "updatedAt">
): Promise<ExerciseTutorial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { now } = nowDates();
  const id = await getNextId(db, "exercise_tutorials");
  const exercise: ExerciseTutorial = { id, ...input, createdAt: now, updatedAt: now };

  await db.collection<ExerciseTutorial>("exercise_tutorials").insertOne(exercise as any);
  return exercise;
}

export async function updateExerciseTutorialById(
  exerciseId: number,
  update: Partial<Pick<ExerciseTutorial, "name" | "description" | "intensityLevel" | "safetyGuidelines" | "videoLink">>
): Promise<ExerciseTutorial | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const { now } = nowDates();
  const set: Record<string, unknown> = { updatedAt: now };
  if (update.name !== undefined) set.name = update.name;
  if (update.description !== undefined) set.description = update.description;
  if (update.intensityLevel !== undefined) set.intensityLevel = update.intensityLevel;
  if (update.safetyGuidelines !== undefined) set.safetyGuidelines = update.safetyGuidelines;
  if (update.videoLink !== undefined) set.videoLink = update.videoLink;

  const result = await db
    .collection<ExerciseTutorial>("exercise_tutorials")
    .updateOne({ id: exerciseId }, { $set: set as any });

  if (!result.matchedCount) return undefined;

  return (
    (await db
      .collection<ExerciseTutorial>("exercise_tutorials")
      .findOne({ id: exerciseId }, { projection: { _id: 0 } as any })) ?? undefined
  );
}

export async function deleteExerciseTutorialById(exerciseId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.collection<ExerciseTutorial>("exercise_tutorials").deleteOne({ id: exerciseId });
  return result.deletedCount > 0;
}
