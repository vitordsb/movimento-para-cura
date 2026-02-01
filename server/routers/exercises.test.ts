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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as any,
  };
}

describe("exercises router", () => {
  describe("list", () => {
    it("should return array of exercises", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.exercises.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getByIntensity", () => {
    it("should accept LIGHT intensity", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.exercises.getByIntensity({ intensity: "LIGHT" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept MODERATE intensity", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.exercises.getByIntensity({ intensity: "MODERATE" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept STRONG intensity", async () => {
      const ctx = createOncologistContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.exercises.getByIntensity({ intensity: "STRONG" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // Note: Create, update, and delete tests require database connection
  // These operations are tested in integration tests with a real database
  // Unit tests focus on authorization and validation logic
});

