import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../api/trpc";
import {
  getAllPatients,
  getPatientProfile,
  updatePatientProfile,
  getUserById,
  getDb,
} from "../db";
import { users, patientProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
  completeAnamnesis: publicProcedure
    .input(
      z.object({
        mainDiagnosis: z.string().min(1), // diagnóstico
        cancerType: z.string().optional(),
        age: z.number().optional(),
        metastasis: z.string().optional(),
        metastasisLocation: z.string().optional(),
        chemotherapy: z.boolean().optional(),
        radiotherapy: z.boolean().optional(),
        hormoneTherapy: z.boolean().optional(),
        surgery: z.string().optional(),
        surgeryWhen: z.string().optional(),
        painScore: z.number().optional(), // 0-10
        fatiguePerceived: z.string().optional(),
        neuropathy: z.boolean().optional(),
        lymphedema: z.boolean().optional(),
        dizziness: z.boolean().optional(),
        fractureHistory: z.boolean().optional(),
        thrombosisHistory: z.boolean().optional(),
        canStandUp: z.boolean().optional(),
        canWalk10Min: z.boolean().optional(),
        exercisedBefore: z.boolean().optional(),
        fearOrTrauma: z.string().optional(),
        treatmentPhase: z.string().optional(),
        treatmentStage: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "PATIENT") {
        throw new Error("Unauthorized");
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const observations = JSON.stringify({
        metastasis: input.metastasis,
        metastasisLocation: input.metastasisLocation,
        chemotherapy: input.chemotherapy,
        radiotherapy: input.radiotherapy,
        hormoneTherapy: input.hormoneTherapy,
        surgery: input.surgery,
        surgeryWhen: input.surgeryWhen,
        painScore: input.painScore,
        fatiguePerceived: input.fatiguePerceived,
        neuropathy: input.neuropathy,
        lymphedema: input.lymphedema,
        dizziness: input.dizziness,
        fractureHistory: input.fractureHistory,
        thrombosisHistory: input.thrombosisHistory,
        canStandUp: input.canStandUp,
        canWalk10Min: input.canWalk10Min,
        exercisedBefore: input.exercisedBefore,
        fearOrTrauma: input.fearOrTrauma,
        treatmentPhase: input.treatmentPhase,
        treatmentStage: input.treatmentStage,
        cancerType: input.cancerType,
        age: input.age,
        observations: input.observations,
      });

      await db
        .insert(patientProfiles)
        .values({
          userId: ctx.user.id,
          mainDiagnosis: input.mainDiagnosis,
          treatmentStage: input.treatmentStage,
          observations,
        })
        .onDuplicateKeyUpdate({
          set: {
            mainDiagnosis: input.mainDiagnosis,
            treatmentStage: input.treatmentStage,
            observations,
          },
        });

      await db.update(users).set({ hasCompletedAnamnesis: true }).where(eq(users.id, ctx.user.id));

      return { success: true, hasCompletedAnamnesis: true };
    }),
});
