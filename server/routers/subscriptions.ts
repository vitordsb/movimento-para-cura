import { protectedProcedure, router } from "../api/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const subscriptionsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    return { hasActivePlan: Boolean(ctx.user?.hasActivePlan) };
  }),

  activate: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) throw new Error("Banco de dados indisponível");

    await db.update(users).set({ hasActivePlan: true }).where(eq(users.id, ctx.user.id));

    return { success: true, hasActivePlan: true };
  }),
});
