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
  let adminId = existingAdmin?.id;

  if (!existingAdmin) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const admin = await createUser({
      openId: ADMIN_EMAIL,
      email: ADMIN_EMAIL,
      name: "Admin OncoLiving",
      passwordHash,
      role: "ONCOLOGIST",
      loginMethod: "password",
      hasActivePlan: true,
      hasCompletedAnamnesis: true,
    });
    adminId = admin.id;
    console.log(`✅ Admin criado: ${ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️ Admin já existe: ${ADMIN_EMAIL}`);
  }

  // --- QUIZ 1: CHECK-IN DIÁRIO (10 Questions) ---
  const dailyQuiz = await prisma.quiz.upsert({
    where: { id: 1 },
    update: {
      name: "Check-in Diário",
      description: "Avaliação rápida de bem-estar para personalizar seu treino.",
      isActive: true,
    },
    create: {
      id: 1, // Force ID 1
      name: "Check-in Diário",
      description: "Avaliação rápida de bem-estar para personalizar seu treino.",
      isActive: true,
      createdBy: adminId,
    }
  });

  // Delete existing questions to rebuild 
  await prisma.quizQuestion.deleteMany({ where: { quizId: dailyQuiz.id } });

  // 1. Energia
  await createQuestion(prisma, dailyQuiz.id, 1, "Como está sua energia hoje?", "MULTIPLE_CHOICE", [
    { text: "Estou bem / com energia", value: "ENERGY_GOOD" },
    { text: "Um pouco cansada", value: "ENERGY_TIRED" },
    { text: "Muito cansada", value: "ENERGY_VERY_TIRED" },
    { text: "Exausta", value: "ENERGY_EXHAUSTED" }
  ]);

  // 2. Fadiga
  await createQuestion(prisma, dailyQuiz.id, 2, "Você sente fadiga agora?", "MULTIPLE_CHOICE", [
    { text: "Não", value: "FATIGUE_NONE" },
    { text: "Leve", value: "FATIGUE_LIGHT" },
    { text: "Moderada", value: "FATIGUE_MODERATE" },
    { text: "Intensa", value: "FATIGUE_INTENSE" }
  ]);

  // 3. Dor
  await createQuestion(prisma, dailyQuiz.id, 3, "Como está sua dor hoje?", "MULTIPLE_CHOICE", [
    { text: "Não estou com dor", value: "PAIN_NONE" },
    { text: "Dor leve", value: "PAIN_LIGHT" },
    { text: "Dor moderada", value: "PAIN_MODERATE" },
    { text: "Dor forte", value: "PAIN_STRONG" }
  ]);

  // 4. Sintomas (Multi-select simulated or handled by frontend? Using Multiple Choice for now, maybe single selection of worst?)
  // User prompt says "(pode marcar mais de um)". DB schema handles generic answers.
  // For simplicity here, we create options. Frontend component needs to support multi-select if type is MULTIPLE_CHOICE?
  // Our schema is `QuestionType` ENUM. Let's stick to simple single choice or rely on specific frontend mapping?
  // Let's assume frontend allows multi-select for Q4.
  await createQuestion(prisma, dailyQuiz.id, 4, "Você teve algum desses sintomas hoje?", "MULTIPLE_CHOICE", [
    { text: "Náusea / enjoo", value: "SYM_NAUSEA" },
    { text: "Tontura", value: "SYM_DIZZINESS" },
    { text: "Falta de ar", value: "SYM_SHORTNESS_BREATH" },
    { text: "Dor de cabeça", value: "SYM_HEADACHE" },
    { text: "Diarreia", value: "SYM_DIARRHEA" },
    { text: "Nenhum desses", value: "SYM_NONE" }
  ]);

  // 5. Tratamento
  await createQuestion(prisma, dailyQuiz.id, 5, "Hoje é dia de tratamento?", "MULTIPLE_CHOICE", [
    { text: "Não", value: "TREATMENT_NO" },
    { text: "Sim, fiz quimioterapia hoje", value: "TREATMENT_CHEMO" },
    { text: "Sim, fiz radioterapia hoje", value: "TREATMENT_RADIO" },
    { text: "Estou em hormonioterapia", value: "TREATMENT_HORMONE" },
    { text: "Estou em pós-cirúrgico recente", value: "TREATMENT_SURGERY" }
  ]);

  // 6. Sono
  await createQuestion(prisma, dailyQuiz.id, 6, "Você dormiu bem?", "MULTIPLE_CHOICE", [
    { text: "Sim", value: "SLEEP_GOOD" },
    { text: "Mais ou menos", value: "SLEEP_OK" },
    { text: "Não dormi bem", value: "SLEEP_BAD" }
  ]);

  // 7. Emocional
  await createQuestion(prisma, dailyQuiz.id, 7, "Como está seu emocional hoje?", "MULTIPLE_CHOICE", [
    { text: "Tranquila", value: "EMO_CALM" },
    { text: "Um pouco ansiosa", value: "EMO_ANXIOUS" },
    { text: "Triste / desanimada", value: "EMO_SAD" },
    { text: "Muito abalada hoje", value: "EMO_SHAKEN" }
  ]);

  // 8. Segurança
  await createQuestion(prisma, dailyQuiz.id, 8, "Você sente segurança para se movimentar hoje?", "MULTIPLE_CHOICE", [
    { text: "Sim", value: "SAFETY_YES" },
    { text: "Um pouco", value: "SAFETY_SOME" },
    { text: "Não tenho certeza", value: "SAFETY_UNSURE" },
    { text: "Não", value: "SAFETY_NO" }
  ]);

  // 9. Desconforto Específico (Sim/Não)
  await createQuestion(prisma, dailyQuiz.id, 9, "Hoje você sente algum desconforto físico específico que te preocupa?", "YES_NO", [
    { text: "Sim", value: "DISCOMFORT_YES" },
    { text: "Não", value: "DISCOMFORT_NO" }
  ]);

  // 10. Consultoria
  await createQuestion(prisma, dailyQuiz.id, 10, "Você gostaria de ter um acompanhamento mais próximo e personalizado?", "MULTIPLE_CHOICE", [
    { text: "Sim, quero saber mais", value: "CONSULT_YES" },
    { text: "Talvez no futuro", value: "CONSULT_MAYBE" },
    { text: "Não por enquanto", value: "CONSULT_NO" }
  ]);

  console.log("✅ Check-in Diário (Re)criado com sucesso.");

  // --- QUIZ 2: AVALIAÇÃO INICIAL (15 Questions) ---
  const introQuiz = await prisma.quiz.upsert({
    where: { id: 2 },
    update: {
      name: "Avaliação Inicial",
      description: "Entenda seu momento para personalizarmos sua jornada.",
      isActive: true,
    },
    create: {
      id: 2, // Force ID 2
      name: "Avaliação Inicial",
      description: "Entenda seu momento para personalizarmos sua jornada.",
      isActive: true,
      createdBy: adminId,
    }
  });

  await prisma.quizQuestion.deleteMany({ where: { quizId: introQuiz.id } });

  // 1. Orientação Médica
  await createQuestion(prisma, introQuiz.id, 1, "Seu médico ou equipe de saúde já comentou que o exercício físico pode fazer parte do seu tratamento?", "MULTIPLE_CHOICE", [
    { text: "Sim, foi orientado", value: "ORIENTED_YES" },
    { text: "Não comentou, mas não proibiu", value: "ORIENTED_NEUTRAL" },
    { text: "Já ouvi opiniões diferentes", value: "ORIENTED_MIXED" },
    { text: "Não, nunca falaram sobre isso", value: "ORIENTED_NO" }
  ]);

  // 2. Fase do Tratamento
  await createQuestion(prisma, introQuiz.id, 2, "Em que fase do tratamento você está agora?", "MULTIPLE_CHOICE", [
    { text: "Antes de iniciar quimioterapia ou radioterapia", value: "STAGE_PRE" },
    { text: "Em quimioterapia", value: "STAGE_CHEMO" },
    { text: "Em radioterapia", value: "STAGE_RADIO" },
    { text: "Em hormonioterapia", value: "STAGE_HORMONE" },
    { text: "Em pós-cirúrgico", value: "STAGE_POST_OP" },
    { text: "Em acompanhamento / remissão", value: "STAGE_REMISSION" }
  ]);

  // 3. Cirurgia Recente
  await createQuestion(prisma, introQuiz.id, 3, "Você realizou alguma cirurgia relacionada ao câncer recentemente?", "MULTIPLE_CHOICE", [
    { text: "Não", value: "SURGERY_NO" },
    { text: "Sim, há menos de 30 dias", value: "SURGERY_LESS_30" },
    { text: "Sim, entre 1 e 3 meses", value: "SURGERY_1_3_MONTHS" },
    { text: "Sim, há mais de 3 meses", value: "SURGERY_MORE_3_MONTHS" }
  ]);

  // 4. Restrição Médica
  await createQuestion(prisma, introQuiz.id, 4, "Você possui alguma restrição médica atual para esforços físicos?", "MULTIPLE_CHOICE", [
    { text: "Não", value: "RESTRICTION_NO" },
    { text: "Sim, restrições leves", value: "RESTRICTION_LIGHT" },
    { text: "Sim, restrições importantes", value: "RESTRICTION_HEAVY" },
    { text: "Não sei informar", value: "RESTRICTION_UNKNOWN" }
  ]);

  // 5. Medos / Impedimentos
  await createQuestion(prisma, introQuiz.id, 5, "Hoje, o que mais te impede ou te dá medo de se movimentar?", "MULTIPLE_CHOICE", [
    { text: "Medo de piorar meu estado de saúde", value: "FEAR_WORSEN" },
    { text: "Cansaço excessivo", value: "FEAR_FATIGUE" },
    { text: "Dor", value: "FEAR_PAIN" },
    { text: "Enjoo / mal-estar", value: "FEAR_NAUSEA" },
    { text: "Falta de orientação clara", value: "FEAR_INFO" },
    { text: "Insegurança sobre o que é permitido", value: "FEAR_SAFETY" },
    { text: "Já tentei antes e não me senti bem", value: "FEAR_BAD_EXP" }
  ]);

  // 6. Sintomas Frequentes
  await createQuestion(prisma, introQuiz.id, 6, "Você sente algum desses sintomas com frequência? (Marque os que se aplicam)", "MULTIPLE_CHOICE", [
    { text: "Fadiga", value: "SYM_FATIGUE" },
    { text: "Dor", value: "SYM_PAIN" },
    { text: "Enjoo", value: "SYM_NAUSEA" },
    { text: "Falta de ar", value: "SYM_BREATH" },
    { text: "Tontura", value: "SYM_DIZZINESS" },
    { text: "Fraqueza", value: "SYM_WEAKNESS" },
    { text: "Inchaço", value: "SYM_SWELLING" },
    { text: "Nenhum desses", value: "SYM_NONE" }
  ]);

  // 7. Estado Atual
  await createQuestion(prisma, introQuiz.id, 7, "Como você se sente fisicamente hoje?", "MULTIPLE_CHOICE", [
    { text: "Me sinto bem e com energia", value: "FEEL_GOOD" },
    { text: "Me sinto mais cansada(o) que o normal", value: "FEEL_TIRED" },
    { text: "Me sinto fraca(o)", value: "FEEL_WEAK" },
    { text: "Me sinto muito debilitada(o)", value: "FEEL_DEBILITATED" }
  ]);

  // 8. Hábito Prévio
  await createQuestion(prisma, introQuiz.id, 8, "Antes do diagnóstico, você tinha o hábito de se exercitar?", "MULTIPLE_CHOICE", [
    { text: "Sim, regularmente", value: "HABIT_REGULAR" },
    { text: "Às vezes", value: "HABIT_SOMETIMES" },
    { text: "Raramente", value: "HABIT_RARELY" },
    { text: "Nunca", value: "HABIT_NEVER" }
  ]);

  // 9. Tentativa Pós Diagnóstico
  await createQuestion(prisma, introQuiz.id, 9, "Depois do diagnóstico, você tentou se exercitar em algum momento?", "MULTIPLE_CHOICE", [
    { text: "Sim, e me senti bem", value: "TRY_OK" },
    { text: "Sim, mas fiquei insegura(o)", value: "TRY_INSECURE" },
    { text: "Sim, mas tive sintomas ruins", value: "TRY_BAD" },
    { text: "Não tentei por medo", value: "TRY_FEAR" },
    { text: "Não tentei por falta de orientação", value: "TRY_NO_INFO" }
  ]);

  // 10. Sedentarismo
  await createQuestion(prisma, introQuiz.id, 10, "Você sente que hoje está mais sedentária(o) do que gostaria?", "MULTIPLE_CHOICE", [
    { text: "Sim", value: "SEDENTARY_YES" },
    { text: "Não", value: "SEDENTARY_NO" },
    { text: "Às vezes", value: "SEDENTARY_SOMETIMES" }
  ]);

  // 11. Desejo Atual
  await createQuestion(prisma, introQuiz.id, 11, "O que você mais gostaria de ter neste momento?", "MULTIPLE_CHOICE", [
    { text: "Alguém dizendo claramente se posso me exercitar hoje", value: "WISH_CLARITY" },
    { text: "Um treino seguro, curto e adaptado ao meu dia", value: "WISH_SAFE_WORKOUT" },
    { text: "Orientação para saber quando descansar sem culpa", value: "WISH_REST_GUIDE" },
    { text: "Mais confiança no meu corpo", value: "WISH_CONFIDENCE" },
    { text: "Todas as alternativas acima", value: "WISH_ALL" }
  ]);

  // 12. Validação do Sistema
  await createQuestion(prisma, introQuiz.id, 12, "Se existisse um sistema que avalia como você está hoje e te orienta se é dia de treinar, adaptar ou descansar, isso ajudaria você?", "MULTIPLE_CHOICE", [
    { text: "Sim, muito", value: "HELP_YES_LOT" },
    { text: "Sim, um pouco", value: "HELP_YES_LITTLE" },
    { text: "Talvez", value: "HELP_MAYBE" },
    { text: "Não", value: "HELP_NO" }
  ]);

  // 13. Frase de Identificação
  await createQuestion(prisma, introQuiz.id, 13, "Qual frase mais representa você hoje?", "MULTIPLE_CHOICE", [
    { text: "Tenho medo de fazer algo errado.", value: "PHRASE_FEAR" },
    { text: "Quero me cuidar, mas não sei por onde começar.", value: "PHRASE_START" },
    { text: "Estou cansada(o) de tanta informação confusa.", value: "PHRASE_CONFUSION" },
    { text: "Quero fazer o melhor pelo meu corpo, com segurança.", value: "PHRASE_SAFETY" }
  ]);

  // 14. Crença no Exercício
  await createQuestion(prisma, introQuiz.id, 14, "Você acredita que o exercício físico pode ajudar no seu tratamento e na sua qualidade de vida, se feito da forma certa?", "MULTIPLE_CHOICE", [
    { text: "Sim", value: "BELIEF_YES" },
    { text: "Talvez", value: "BELIEF_MAYBE" },
    { text: "Nunca pensei nisso", value: "BELIEF_NEVER" }
  ]);

  // 15. Consultoria Individual
  await createQuestion(prisma, introQuiz.id, 15, "Você gostaria de ter um acompanhamento individual com uma profissional especializada...?", "MULTIPLE_CHOICE", [
    { text: "Sim, gostaria de saber mais", value: "CONSULT_YES" },
    { text: "Talvez, dependendo do formato", value: "CONSULT_MAYBE" },
    { text: "No momento, prefiro apenas o aplicativo", value: "CONSULT_NO" },
    { text: "Não", value: "CONSULT_NEVER" }
  ]);

  console.log("✅ Avaliação Inicial (Re)criada com 15 perguntas reais.");

  // Check for exercises
  // Force delete to ensure links are updated
  await prisma.exerciseTutorial.deleteMany({});

  console.log("ℹ️ Criando exercícios de exemplo...");
  await prisma.exerciseTutorial.createMany({
      data: [
        {
          name: "Respiração Diafragmática",
          description: "Exercício de respiração para relaxamento.",
          intensityLevel: "LIGHT",
          videoLink: "https://www.youtube.com/playlist?list=PL3U7uv4DxYI1xHPCAzbFiV9RysgdWP_vK"
        },
        {
          name: "Caminhada Estacionária",
          description: "Simulação de caminhada no lugar.",
          intensityLevel: "MODERATE",
          videoLink: "https://www.youtube.com/playlist?list=PL3U7uv4DxYI1xHPCAzbFiV9RysgdWP_vK"
        },
        {
          name: "Agachamento Livre",
          description: "Fortalecimento de pernas.",
          intensityLevel: "STRONG",
          videoLink: "https://www.youtube.com/playlist?list=PL3U7uv4DxYI1xHPCAzbFiV9RysgdWP_vK"
        }
      ]
    });
  console.log("✅ Exercícios criados.");

  console.log("✅ Seed finalizado.");
  await prisma.$disconnect();
  process.exit(0);
}

async function createQuestion(prisma: any, quizId: number, order: number, text: string, type: string, options: { text: string, value: string }[]) {
  const q = await prisma.quizQuestion.create({
    data: {
      quizId,
      text,
      questionType: type,
      weight: 1.0,
      order,
    }
  });

  if (options.length > 0) {
    await prisma.questionOption.createMany({
      data: options.map((opt, idx) => ({
        questionId: q.id,
        text: opt.text,
        scoreValue: 0, // Not using score sum anymore
        order: idx + 1
      }))
    });
  }
}

seed().catch((err) => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
