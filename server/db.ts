import { eq, and, gte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  patientProfiles,
  InsertPatientProfile,
  quizzes,
  quizQuestions,
  quizQuestionOptions,
  quizResponses,
  quizResponseAnswers,
  exerciseTutorials,
  quizScoringConfig,
} from "../drizzle/schema";
import { ENV } from "./config/env";

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
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod"] as const;
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
    if (user.hasActivePlan !== undefined) {
      values.hasActivePlan = user.hasActivePlan;
      updateSet.hasActivePlan = user.hasActivePlan;
    }
    if (user.hasCompletedAnamnesis !== undefined) {
      values.hasCompletedAnamnesis = user.hasCompletedAnamnesis;
      updateSet.hasCompletedAnamnesis = user.hasCompletedAnamnesis;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'ONCOLOGIST';
      updateSet.role = 'ONCOLOGIST';
    } else {
      values.role = 'PATIENT';
      updateSet.role = 'PATIENT';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    updateSet.email = user.email;

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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Patient-related queries
 */
export async function getPatientProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPatients() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .where(eq(users.role, 'PATIENT'));
}

export async function updatePatientProfile(
  userId: number,
  data: Partial<InsertPatientProfile>
) {
  const db = await getDb();
  if (!db) return undefined;

  // First check if profile exists
  const existing = await getPatientProfile(userId);
  if (!existing) {
    // Create new profile
    const newProfile: InsertPatientProfile = {
      userId,
      ...data,
    };
    await db.insert(patientProfiles).values(newProfile);
    return await getPatientProfile(userId);
  }

  // Update existing profile
  await db
    .update(patientProfiles)
    .set(data)
    .where(eq(patientProfiles.userId, userId));

  return await getPatientProfile(userId);
}

/**
 * Quiz-related queries
 */
export async function getActiveQuiz() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.isActive, true))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getQuizById(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllQuizzes() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(quizzes);
}

export async function getQuizWithQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const quiz = await getQuizById(quizId);
  if (!quiz) return undefined;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.order);

  // Get options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await db
        .select()
        .from(quizQuestionOptions)
        .where(eq(quizQuestionOptions.questionId, q.id))
        .orderBy(quizQuestionOptions.order);
      return { ...q, options };
    })
  );

  return { ...quiz, questions: questionsWithOptions };
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
    text: "Como está seu nível de energia hoje? (0 = Muito baixo, 10 = Muito alto)",
    questionType: "SCALE_0_10",
    weight: "1.5",
    order: 1,
  },
  {
    text: "Como está sua dor hoje? (0 = Sem dor, 10 = Dor intensa)",
    questionType: "SCALE_0_10",
    weight: "2.0",
    order: 2,
  },
  {
    text: "Você está sentindo náusea hoje?",
    questionType: "YES_NO",
    weight: "1.0",
    order: 3,
  },
  {
    text: "Como foi a qualidade do seu sono na última noite?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.2",
    order: 4,
    options: [
      { text: "Ruim", scoreValue: "2", order: 1 },
      { text: "Regular", scoreValue: "5", order: 2 },
      { text: "Boa", scoreValue: "8", order: 3 },
      { text: "Excelente", scoreValue: "10", order: 4 },
    ],
  },
  {
    text: "Você urinou hoje?",
    questionType: "YES_NO",
    weight: "1.0",
    order: 5,
  },
  {
    text: "Quantos líquidos você ingeriu hoje?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 6,
    options: [
      { text: "Menos de 500 ml", scoreValue: "2", order: 1 },
      { text: "Entre 500 ml e 1 L", scoreValue: "5", order: 2 },
      { text: "Entre 1 L e 2 L", scoreValue: "8", order: 3 },
      { text: "Mais de 2 L", scoreValue: "10", order: 4 },
    ],
  },
  {
    text: "Como foi sua última alimentação?",
    questionType: "MULTIPLE_CHOICE",
    weight: "1.0",
    order: 7,
    options: [
      { text: "Ainda não me alimentei", scoreValue: "2", order: 1 },
      { text: "Lanche leve", scoreValue: "5", order: 2 },
      { text: "Refeição completa", scoreValue: "8", order: 3 },
      { text: "Tive enjoo/vômito", scoreValue: "1", order: 4 },
    ],
  },
  {
    text: "Você está sentindo tontura ou falta de ar?",
    questionType: "YES_NO",
    weight: "1.5",
    order: 8,
  },
  {
    text: "Teve febre ou calafrios nas últimas 24 horas?",
    questionType: "YES_NO",
    weight: "2.0",
    order: 9,
  },
  {
    text: "Percebeu sangramentos ou hematomas diferentes do habitual?",
    questionType: "YES_NO",
    weight: "2.0",
    order: 10,
  },
];

/**
 * Ensures the active quiz has the baseline set of questions (up to 10),
 * inserting any missing ones without duplicating existing texts.
 */
export async function ensureBaselineQuizQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return;

  const existingQuestions = await db
    .select({ id: quizQuestions.id, text: quizQuestions.text })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

  const existingTexts = new Set(existingQuestions.map(q => q.text));

  for (const q of BASELINE_QUESTIONS) {
    if (existingTexts.has(q.text)) continue;

    const insertResult = await db.insert(quizQuestions).values({
      quizId,
      text: q.text,
      questionType: q.questionType,
      weight: q.weight,
      order: q.order,
    });
    const questionId = insertResult[0].insertId as number;

    if (q.options?.length) {
      await db.insert(quizQuestionOptions).values(
        q.options.map(opt => ({
          questionId,
          text: opt.text,
          scoreValue: opt.scoreValue,
          order: opt.order,
        }))
      );
    }
  }
}

/**
 * Quiz Response queries
 */
export async function getTodayResponse(userId: number, quizId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(quizResponses)
    .where(
      and(
        eq(quizResponses.userId, userId),
        eq(quizResponses.quizId, quizId),
        gte(quizResponses.responseDate, today)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientResponses(userId: number, limit: number = 30) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(quizResponses)
    .where(eq(quizResponses.userId, userId))
    .orderBy(desc(quizResponses.responseDate))
    .limit(limit);
}

/**
 * Exercise queries
 */
export async function getAllExercises() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(exerciseTutorials);
}

export async function getExercisesByIntensity(intensity: "LIGHT" | "MODERATE" | "STRONG") {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(exerciseTutorials)
    .where(eq(exerciseTutorials.intensityLevel, intensity));
}

/**
 * Scoring config queries
 */
export async function getScoringConfigForQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(quizScoringConfig)
    .where(eq(quizScoringConfig.quizId, quizId))
    .orderBy(quizScoringConfig.minScore as any);
}

// TODO: add feature queries here as your schema grows.
