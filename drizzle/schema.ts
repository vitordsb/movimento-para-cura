import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Supports both PATIENT and ONCOLOGIST roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["PATIENT", "ONCOLOGIST"]).notNull().default("PATIENT"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  hasActivePlan: boolean("hasActivePlan").default(false).notNull(),
  hasCompletedAnamnesis: boolean("hasCompletedAnamnesis").default(false).notNull(),
  planType: varchar("planType", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Patient profile extending user data with clinical information.
 */
export const patientProfiles = mysqlTable("patient_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  mainDiagnosis: text("mainDiagnosis"),
  treatmentStage: varchar("treatmentStage", { length: 100 }), // e.g., "pre-chemo", "during-chemo", "post-treatment"
  dateOfBirth: timestamp("dateOfBirth"),
  gender: varchar("gender", { length: 20 }),
  observations: text("observations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertPatientProfile = typeof patientProfiles.$inferInsert;

/**
 * Quiz configuration created by oncologists.
 */
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(), // FK to users (oncologist)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

/**
 * Individual questions within a quiz.
 */
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  text: text("text").notNull(),
  questionType: mysqlEnum("questionType", ["YES_NO", "SCALE_0_10", "MULTIPLE_CHOICE"]).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.00").notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

/**
 * Options for multiple choice questions.
 */
export const quizQuestionOptions = mysqlTable("quiz_question_options", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  text: varchar("text", { length: 255 }).notNull(),
  scoreValue: decimal("scoreValue", { precision: 5, scale: 2 }).notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestionOption = typeof quizQuestionOptions.$inferSelect;
export type InsertQuizQuestionOption = typeof quizQuestionOptions.$inferInsert;

/**
 * Daily quiz responses from patients.
 * One response per patient per day.
 */
export const quizResponses = mysqlTable("quiz_responses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users (patient)
  quizId: int("quizId").notNull(),
  responseDate: timestamp("responseDate").notNull(), // Date only, no time
  totalScore: decimal("totalScore", { precision: 8, scale: 2 }).notNull(),
  isGoodDayForExercise: boolean("isGoodDayForExercise").notNull(),
  recommendedExerciseType: varchar("recommendedExerciseType", { length: 100 }).notNull(),
  generalObservations: text("generalObservations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;

/**
 * Individual answers to quiz questions.
 */
export const quizResponseAnswers = mysqlTable("quiz_response_answers", {
  id: int("id").autoincrement().primaryKey(),
  responseId: int("responseId").notNull(),
  questionId: int("questionId").notNull(),
  answerValue: varchar("answerValue", { length: 255 }).notNull(), // "YES", "NO", "7", "OPTION_A", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizResponseAnswer = typeof quizResponseAnswers.$inferSelect;
export type InsertQuizResponseAnswer = typeof quizResponseAnswers.$inferInsert;

/**
 * Exercise tutorials and recommendations.
 */
export const exerciseTutorials = mysqlTable("exercise_tutorials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  intensityLevel: mysqlEnum("intensityLevel", ["LIGHT", "MODERATE", "STRONG"]).notNull(),
  safetyGuidelines: text("safetyGuidelines"),
  videoLink: varchar("videoLink", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExerciseTutorial = typeof exerciseTutorials.$inferSelect;
export type InsertExerciseTutorial = typeof exerciseTutorials.$inferInsert;

/**
 * Scoring configuration for determining exercise recommendations.
 * Defines score ranges and corresponding exercise types.
 */
export const quizScoringConfig = mysqlTable("quiz_scoring_config", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  minScore: decimal("minScore", { precision: 8, scale: 2 }).notNull(),
  maxScore: decimal("maxScore", { precision: 8, scale: 2 }).notNull(),
  isGoodDay: boolean("isGoodDay").notNull(),
  recommendedExerciseType: varchar("recommendedExerciseType", { length: 100 }).notNull(),
  exerciseDescription: text("exerciseDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizScoringConfig = typeof quizScoringConfig.$inferSelect;
export type InsertQuizScoringConfig = typeof quizScoringConfig.$inferInsert;

/**
 * Relations for type safety and query convenience.
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  patientProfile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
  createdQuizzes: many(quizzes),
  quizResponses: many(quizResponses),
}));

export const patientProfilesRelations = relations(patientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [patientProfiles.userId],
    references: [users.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, {
    fields: [quizzes.createdBy],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  responses: many(quizResponses),
  scoringConfigs: many(quizScoringConfig),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  options: many(quizQuestionOptions),
  answers: many(quizResponseAnswers),
}));

export const quizQuestionOptionsRelations = relations(quizQuestionOptions, ({ one }) => ({
  question: one(quizQuestions, {
    fields: [quizQuestionOptions.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizResponsesRelations = relations(quizResponses, ({ one, many }) => ({
  user: one(users, {
    fields: [quizResponses.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizResponses.quizId],
    references: [quizzes.id],
  }),
  answers: many(quizResponseAnswers),
}));

export const quizResponseAnswersRelations = relations(quizResponseAnswers, ({ one }) => ({
  response: one(quizResponses, {
    fields: [quizResponseAnswers.responseId],
    references: [quizResponses.id],
  }),
  question: one(quizQuestions, {
    fields: [quizResponseAnswers.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizScoringConfigRelations = relations(quizScoringConfig, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizScoringConfig.quizId],
    references: [quizzes.id],
  }),
}));
