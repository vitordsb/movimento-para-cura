/**
 * Shared domain types (MongoDB backend).
 * Keep these types stable because the client infers API output types from the tRPC router.
 */

export type UserRole = "PATIENT" | "ONCOLOGIST";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  loginMethod: string | null;
  hasActivePlan: boolean;
  hasCompletedAnamnesis: boolean;
  planType?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;

  // Billing Info
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  province?: string | null;

  createdAt: string | Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type PatientProfile = {
  id: number;
  userId: number;
  mainDiagnosis: string | null;
  treatmentStage: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  observations: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type QuizQuestionType = "YES_NO" | "SCALE_0_10" | "MULTIPLE_CHOICE";

export type QuizQuestionOption = {
  id: number;
  text: string;
  scoreValue: string;
  order: number;
  createdAt: Date;
};

export type QuizQuestion = {
  id: number;
  quizId: number;
  text: string;
  questionType: QuizQuestionType;
  weight: string;
  order: number;
  options: QuizQuestionOption[];
  createdAt: Date;
  updatedAt: Date;
};

export type QuizScoringConfig = {
  id: number;
  quizId: number;
  minScore: string;
  maxScore: string;
  isGoodDay: boolean;
  recommendedExerciseType: string;
  exerciseDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Quiz = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuizQuestion[];
  scoringConfig?: QuizScoringConfig[];
};

export type QuizResponseAnswer = {
  id: number;
  responseId: number;
  questionId: number;
  answerValue: string;
  createdAt: Date;
};

export type QuizResponse = {
  id: number;
  userId: number;
  quizId: number;
  responseDate: Date;
  totalScore: string;
  isGoodDayForExercise: boolean;
  recommendedExerciseType: string;
  generalObservations?: string | null;
  answers?: QuizResponseAnswer[];
  createdAt: Date;
  updatedAt: Date;
};

export type ExerciseIntensity = "LIGHT" | "MODERATE" | "STRONG";

export type ExerciseTutorial = {
  id: number;
  name: string;
  description: string | null;
  intensityLevel: ExerciseIntensity;
  safetyGuidelines: string | null;
  videoLink: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export * from "./_core/errors";
