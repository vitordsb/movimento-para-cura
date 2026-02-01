import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../api/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPatientContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("responses router", () => {
  describe("submitDaily", () => {
    it("should reject non-patient users", async () => {
      const oncologistUser: AuthenticatedUser = {
        id: 2,
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

      const ctx: TrpcContext = {
        user: oncologistUser,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.responses.submitDaily({
          quizId: 1,
          answers: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Apenas pacientes podem acessar");
      }
    });

    it("should reject unauthenticated users", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.responses.submitDaily({
          quizId: 1,
          answers: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Apenas pacientes podem acessar");
      }
    });
  });

  describe("getMyHistory", () => {
    it("should reject unauthenticated users", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.responses.getMyHistory({ limit: 30 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Not authenticated");
      }
    });

    it("should allow authenticated patients to view their history", async () => {
      const ctx = createPatientContext(1);
      const caller = appRouter.createCaller(ctx);

      // This should not throw
      const result = await caller.responses.getMyHistory({ limit: 30 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getPatientHistory", () => {
    it("should reject non-oncologist users", async () => {
      const ctx = createPatientContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.responses.getPatientHistory({ patientId: 2, limit: 30 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("You do not have required permission");
      }
    });

    it("should allow oncologists to view patient history", async () => {
      const oncologistUser: AuthenticatedUser = {
        id: 2,
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

      const ctx: TrpcContext = {
        user: oncologistUser,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      // This should not throw
      const result = await caller.responses.getPatientHistory({
        patientId: 1,
        limit: 30,
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getToday", () => {
    it("should reject non-patient users", async () => {
      const oncologistUser: AuthenticatedUser = {
        id: 2,
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

      const ctx: TrpcContext = {
        user: oncologistUser,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.responses.getToday({ quizId: 1 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Apenas pacientes podem acessar");
      }
    });

    it("should allow patients to view their today's response", async () => {
      const ctx = createPatientContext(1);
      const caller = appRouter.createCaller(ctx);

      // This should not throw
      const result = await caller.responses.getToday({ quizId: 1 });
      // Result can be undefined if no response today
      expect(result === undefined || typeof result === "object").toBe(true);
    });
  });
});
