import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Debugging Quiz State...");
  console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":***@")}`); // Log masked URL to verify env

  try {
    const count = await prisma.quiz.count();
    console.log(`📊 Total quizzes in DB: ${count}`);
    
    const active = await prisma.quiz.findFirst({
      where: { isActive: true },
      include: { questions: true, scoringConfigs: true }
    });
    
    if (active) {
      console.log(`✅ Active quiz found!`);
      console.log(`   ID: ${active.id}`);
      console.log(`   Name: "${active.name}"`);
      console.log(`   Active: ${active.isActive}`);
      console.log(`   Questions: ${active.questions.length}`);
      console.log(`   Scoring Configs: ${active.scoringConfigs.length}`);
    } else {
      console.log("❌ NO ACTIVE QUIZ FOUND.");
      
      const all = await prisma.quiz.findMany();
      if (all.length > 0) {
        console.log("   Existing quizzes (inactive):");
        all.forEach(q => console.log(`   - [${q.id}] ${q.name} (Active: ${q.isActive})`));
      } else {
        console.log("   Based is completely empty.");
      }
    }
  } catch (e) {
    console.error("❌ CRTICAL DB ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
