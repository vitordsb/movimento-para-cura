import "dotenv/config";
// @ts-ignore: Library has incorrect types (d.ts mismatch with esm export)
import Scrypt from "scrypt-kdf";
import { getUserByEmail, createUser, getPrisma } from "./server/db";
import { ENV } from "./server/config/env";

const ADMIN_EMAIL = "admin@oncoliving.com.br";
const ADMIN_PASSWORD = "senha123";

async function hashPassword(password: string) {
  const buffer = await Scrypt.kdf(password, { logN: 15, r: 8, p: 1 });
  return Buffer.from(buffer).toString("base64");
}

async function verifyPassword(stored: string | null | undefined, password: string) {
  if (!stored) return false;
  try {
    const buffer = Buffer.from(stored, "base64");
    return await Scrypt.verify(buffer, password);
  } catch {
    return false;
  }
}

async function seed() {
  console.log("🌱 Seeding database...");

  if (!ENV.databaseUrl) {
    console.error("❌ DATABASE_URL não está definido no .env");
    process.exit(1);
  }

  const prisma = getPrisma();

  // Ensure admin exists
  const existingAdmin = await getUserByEmail(ADMIN_EMAIL);
  if (!existingAdmin) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await createUser({
      openId: ADMIN_EMAIL,
      email: ADMIN_EMAIL,
      name: "Admin OncoLiving",
      passwordHash,
      role: "ONCOLOGIST",
      loginMethod: "password",
      hasActivePlan: true,
      hasCompletedAnamnesis: true,
    });
    console.log(`✅ Admin criado: ${ADMIN_EMAIL}`);
  } else {
    // Check if password works
    const isPasswordOk = await verifyPassword(existingAdmin.passwordHash ?? null, ADMIN_PASSWORD);
    console.log(`ℹ️ Admin já existe: ${ADMIN_EMAIL} ${isPasswordOk ? "(senha padrão OK)" : "(senha diferente)"}`);
  }

  // Check for quiz
  const activeQuiz = await prisma.quiz.findFirst({ where: { isActive: true } });
  if (!activeQuiz) {
    console.log("ℹ️ Nenhum quiz ativo encontrado. Criando check-in diário padrão...");

    // Create Default Quiz
    const quiz = await prisma.quiz.create({
      data: {
        name: "Check-in Diário",
        description: "Avaliação rápida de bem-estar para personalizar seu treino.",
        isActive: true,
        createdBy: existingAdmin?.id, // Link to admin if available
      }
    });

    console.log(`✅ Quiz criado: ${quiz.name}`);

    // Create Questions
    // 1. Como você se sente? (0-10)
    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        text: "Como você classificaria sua disposição geral hoje?",
        questionType: "SCALE_0_10",
        weight: 1.0,
        order: 1,
      }
    });

    // 2. Nível de dor (0-10) - Inverse scoring implies logic in analysis, but here strictly sum
    // For simplicity, let's ask "Quanto bem-estar você sente?" so higher is better
    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        text: "Como está seu nível de energia?",
        questionType: "SCALE_0_10",
        weight: 1.0,
        order: 2,
      }
    });

    // 3. Disposto a treinar? (YES/NO)
    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        text: "Você se sente seguro para realizar atividades físicas hoje?",
        questionType: "YES_NO",
        weight: 2.0, // Higher weight
        order: 3,
      }
    });

    console.log("✅ Perguntas criadas.");

    // Create Scoring Configs (Ranges)
    // Max score approx: 10 + 10 + (2*10 for YES) = 40? 
    // Wait, YES usually scores fixed value? logic not shown in frontend, backend handles scoring.
    // Assuming YES=10, NO=0. Max = 10+10+20 = 40.

    // Low score: 0-15 -> Rest
    await prisma.quizScoringConfig.create({
      data: {
        quizId: quiz.id,
        minScore: 0,
        maxScore: 15,
        isGoodDay: false,
        recommendedExerciseType: "Recuperação / Yoga",
        exerciseDescription: "Hoje o foco é descanso ativo e respiração.",
      }
    });

    // Medium score: 15-30 -> Light
    await prisma.quizScoringConfig.create({
      data: {
        quizId: quiz.id,
        minScore: 15,
        maxScore: 30,
        isGoodDay: true,
        recommendedExerciseType: "Caminhada Leve / Alongamento",
        exerciseDescription: "Atividade leve para manter o movimento.",
      }
    });

    // High score: 30-100 -> Normal
    await prisma.quizScoringConfig.create({
      data: {
        quizId: quiz.id,
        minScore: 30,
        maxScore: 100,
        isGoodDay: true,
        recommendedExerciseType: "Treino de Força / Aeróbico",
        exerciseDescription: "Você está bem para treinar normalmente.",
      }
    });

    console.log("✅ Configuração de pontuação criada.");

  } else {
    console.log(`ℹ️ Quiz ativo já existe: ${activeQuiz.name}`);
  }

  // Check for exercises
  const exerciseCount = await prisma.exerciseTutorial.count();
  console.log(`ℹ️ Exercícios no banco: ${exerciseCount}`);

  if (exerciseCount === 0) {
    console.log("ℹ️ Criando exercícios de exemplo...");
    await prisma.exerciseTutorial.createMany({
      data: [
        {
          name: "Respiração Diafragmática",
          description: "Exercício de respiração para relaxamento.",
          intensityLevel: "LIGHT",
          videoLink: "https://youtube.com/..."
        },
        {
          name: "Caminhada Estacionária",
          description: "Simulação de caminhada no lugar.",
          intensityLevel: "MODERATE",
          videoLink: "https://youtube.com/..."
        },
        {
          name: "Agachamento Livre",
          description: "Fortalecimento de pernas.",
          intensityLevel: "STRONG",
          videoLink: "https://youtube.com/..."
        }
      ]
    });
    console.log("✅ Exercícios criados.");
  }

  console.log("✅ Seed finalizado.");
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
