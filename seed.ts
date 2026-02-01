import "dotenv/config";
// @ts-ignore: Library has incorrect types (d.ts mismatch with esm export)
import Scrypt from "scrypt-kdf";
import { getAllExercises, getActiveQuiz, getUserByEmail, createUser } from "./server/db";
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

  // These getters will auto-generate defaults if missing
  const quiz = await getActiveQuiz();
  if (quiz) console.log(`✅ Quiz ativo: #${quiz.id} (${quiz.name}) - Questões: ${(quiz as any).questions?.length ?? '?'}`);

  const exercises = await getAllExercises();
  console.log(`✅ Exercícios: ${exercises.length}`);

  console.log("✅ Seed finalizado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
