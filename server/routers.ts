import { systemRouter } from "./api/systemRouter";
import { publicProcedure, router } from "./api/trpc";
import { patientsRouter } from "./routers/patients";
import { quizzesRouter } from "./routers/quizzes";
import { responsesRouter } from "./routers/responses";
import { exercisesRouter } from "./routers/exercises";
import { subscriptionsRouter } from "./routers/subscriptions";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  patients: patientsRouter,
  quizzes: quizzesRouter,
  responses: responsesRouter,
  exercises: exercisesRouter,
  subscriptions: subscriptionsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
