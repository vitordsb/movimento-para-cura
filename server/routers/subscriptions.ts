import { z } from "zod";
import { protectedProcedure, router } from "../api/trpc";
import { updateUserById } from "../db";
import { createAsaasCustomer, createAsaasSubscription } from "../services/asaas";

export const subscriptionsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    return {
      hasActivePlan: Boolean(ctx.user?.hasActivePlan),
      asaasSubscriptionId: ctx.user?.asaasSubscriptionId || null,
    };
  }),

  createPayment: protectedProcedure
    .input(z.object({
      planType: z.enum(["monthly", "annual"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("User not found");

      // Create Asaas customer if not exists
      let asaasCustomerId = ctx.user.asaasCustomerId;
      if (!asaasCustomerId) {
        const customer = await createAsaasCustomer({
          name: ctx.user.name || "Cliente",
          email: ctx.user.email,
        });
        asaasCustomerId = customer.id;
        await updateUserById(ctx.user.id, { asaasCustomerId });
      }

      // Calculate subscription value and cycle
      const value = input.planType === "monthly" ? 99.00 : 990.00;
      const cycle = input.planType === "monthly" ? "MONTHLY" : "YEARLY";

      // Create subscription
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 1); // First charge tomorrow

      const subscription = await createAsaasSubscription({
        customer: asaasCustomerId,
        billingType: "UNDEFINED", // Let customer choose payment method
        value,
        cycle,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        description: `Assinatura ${input.planType === "monthly" ? "Mensal" : "Anual"} - OncoLiving`,
      });

      // Store subscription ID
      await updateUserById(ctx.user.id, {
        asaasSubscriptionId: subscription.id,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        // Asaas payment URL format
        paymentUrl: `https://www.asaas.com/c/${asaasCustomerId}`,
      };
    }),

  activate: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Banco de dados indisponível");

    await updateUserById(ctx.user.id, { hasActivePlan: true });

    return { success: true, hasActivePlan: true };
  }),
});
