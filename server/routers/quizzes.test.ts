import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../api/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createOncologistContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "oncologist-test-001",
    email: "oncologist@test.local",
    name: "Test Oncologist",
    loginMethod: "local",
    role: "ONCOLOGIST",
    hasActivePlan: true,
    hasCompletedAnamnesis: false,
    planType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as any,
  };
}

function createPatientContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "patient-test-001",
    email: "patient@test.local",
    name: "Test Patient",
    loginMethod: "local",
    role: "PATIENT",
    hasActivePlan: true,
    hasCompletedAnamnesis: true,
    planType: "FREE_LIMITED",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as any,
  };
}

describe("quizzes router", () => {
  describe("getActive", () => {
    it("should return active quiz for patients", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quizzes.getActive();
      expect(result).toBeDefined();
    });
  });

  describe("list (admin only)", () => {
    it("should allow oncologists to list all quizzes", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quizzes.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject non-oncologist users", async () => {
      const ctx = createPatientContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.quizzes.list();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("You do not have required permission");
      }
    });
  });

  describe("getById", () => {
    it("should return quiz with questions", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      // First get active quiz to have a valid ID
      const active = await caller.quizzes.getActive();
      if (!active) {
        // Skip test if no active quiz
        return;
      }

      const result = await caller.quizzes.getById({ quizId: active.id });
      expect(result).toBeDefined();
      expect(result.id).toBe(active.id);
    });
  });

  // Note: Create, update, and delete tests require database connection
  // These operations are tested in integration tests with a real database
  // Unit tests focus on authorization and validation logic
});

