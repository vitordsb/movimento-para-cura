import { z } from "zod";
import { adminProcedure, publicProcedure, patientProcedure, router } from "../api/trpc";
import {
  getAllPatients,
  getPatientProfile,
  updatePatientProfile,
  getUserById,
  updateUserById,
} from "../db";
import { UnauthorizedError } from "../errors";

export const patientsRouter = router({
  /**
   * List all patients (admin only)
   */
  list: adminProcedure.query(async () => {
    const patients = await getAllPatients();
    return patients.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      createdAt: p.createdAt,
    }));
  }),

  /**
   * Get patient details by ID (admin only, or own profile for patient)
   */
  getById: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Allow patients to view their own profile, admins can view any
      if (
        ctx.user?.role !== "ONCOLOGIST" &&
        ctx.user?.id !== input.patientId
      ) {
        throw new Error("Unauthorized");
      }

      const user = await getUserById(input.patientId);
      if (!user || user.role !== "PATIENT") {
        throw new Error("Patient not found");
      }

      const profile = await getPatientProfile(input.patientId);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        profile: profile || null,
      };
    }),

  /**
   * Update patient profile (patient can update own, admin can update any)
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        mainDiagnosis: z.string().optional(),
        treatmentStage: z.string().optional(),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Allow patients to update their own profile, admins can update any
      if (
        ctx.user?.role !== "ONCOLOGIST" &&
        ctx.user?.id !== input.patientId
      ) {
        throw new Error("Unauthorized");
      }

      const updated = await updatePatientProfile(input.patientId, {
        mainDiagnosis: input.mainDiagnosis,
        treatmentStage: input.treatmentStage,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        observations: input.observations,
      });

      return updated;
    }),

  /**
   * Complete anamnesis (patient only, sets flag and stores info)
   */
  completeAnamnesis: patientProcedure
    .input(
      z.object({
        answers: z.array(
          z.object({
            questionNumber: z.number(),
            questionText: z.string(),
            answer: z.string(),
          })
        ),
        treatmentStage: z.string().optional(),
        interest: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const observations = {
        anamnesisVersion: "v2",
        answers: input.answers,
        treatmentStage: input.treatmentStage,
        interest: input.interest,
      };

      await updatePatientProfile(ctx.user.id, {
        mainDiagnosis: null,
        treatmentStage: input.treatmentStage,
        observations,
      });

      await updateUserById(ctx.user.id, { hasCompletedAnamnesis: true });

      return { success: true, hasCompletedAnamnesis: true };
    }),
});
