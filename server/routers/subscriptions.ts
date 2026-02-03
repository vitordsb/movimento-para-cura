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
      billingInfo: z.object({
        cpfCnpj: z.string(),
        mobilePhone: z.string(),
        postalCode: z.string().optional(),
        address: z.string().optional(),
        addressNumber: z.string().optional(),
        province: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("User not found");

      // Check if user already has a PENDING/ACTIVE subscription
      if (ctx.user.asaasSubscriptionId) {
        try {
          // Dynamic import to avoid circular dep if any, though not expected here
          const { getSubscription, cancelAsaasSubscription } = await import("../services/asaas");
          const existingSub = await getSubscription(ctx.user.asaasSubscriptionId);

          // Asaas subscription statuses: ACTIVE, EXPIRED, OVERDUE (no PENDING for subscriptions usually)
          // If ACTIVE or OVERDUE, we should handle it.
          if (existingSub.status === "ACTIVE" || existingSub.status === "OVERDUE") {
            const requestedCycle = input.planType === "monthly" ? "MONTHLY" : "YEARLY";

            if (existingSub.cycle === requestedCycle) {
              // Reuse existing subscription (send user to invoice)
              const { getSubscriptionPayments } = await import("../services/asaas");
              const payments = await getSubscriptionPayments(existingSub.id);
              const pendingPayment = payments.find(p => p.status === "PENDING" || p.status === "OVERDUE");

              if (pendingPayment) {
                return {
                  success: true,
                  subscriptionId: existingSub.id,
                  paymentUrl: pendingPayment.invoiceUrl,
                  customerId: existingSub.customer,
                }
              }
              // If no pending payment found for active/overdue sub, something is odd, maybe just generated? 
              // Fallback to customer center or generic error?
              // Let's create a new one to be safe if we can't find a payment to pay.
              // Actually, if it's ACTIVE, maybe they just paid? 
              // But if they clicked "Subscribe", they likely want to pay.
            } else {
              // Different plan (e.g. was Monthly, now Annual). Cancel old one.
              await cancelAsaasSubscription(existingSub.id);
              // Proceed to create new one below
            }
          }
          // If EXPIRED, we just create a new one (fall through)
        } catch (err: any) {
          // If error checking existing, log and proceed to create new
          console.warn("Could not reuse existing subscription:", err);
        }
      }

      // Update User with billing info if provided
      if (input.billingInfo) {
        await updateUserById(ctx.user.id, {
          cpfCnpj: input.billingInfo.cpfCnpj,
          mobilePhone: input.billingInfo.mobilePhone,
          postalCode: input.billingInfo.postalCode,
          address: input.billingInfo.address,
          addressNumber: input.billingInfo.addressNumber,
          province: input.billingInfo.province,
        });
      }

      // Create Asaas customer if not exists or if we need to update info
      let asaasCustomerId = ctx.user.asaasCustomerId;
      if (!asaasCustomerId) {
        // ... (create customer logic)
        const customer = await createAsaasCustomer({
          name: ctx.user.name || "Cliente",
          email: ctx.user.email,
          cpfCnpj: input.billingInfo?.cpfCnpj,
          mobilePhone: input.billingInfo?.mobilePhone,
          postalCode: input.billingInfo?.postalCode,
          address: input.billingInfo?.address,
          addressNumber: input.billingInfo?.addressNumber,
          province: input.billingInfo?.province,
        });
        asaasCustomerId = customer.id;
        await updateUserById(ctx.user.id, { asaasCustomerId });
      }

      // Calculate subscription value and cycle
      const value = input.planType === "monthly" ? 99.00 : 990.00;
      const cycle = input.planType === "monthly" ? "MONTHLY" : "YEARLY";

      // Create subscription
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 1); // First charge tomorrow? Or today?
      // Usually subscriptions charge immediately or on due date. 
      // If we set nextDueDate to tomorrow, the charge is created for tomorrow.
      // If we want immediate payment, maybe today?
      // Let's keep tomorrow or today. If today, Asaas might create immediate charge.

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

      // Fetch the first payment to get the correct invoice URL
      const { getSubscriptionPayments } = await import("../services/asaas");
      // Give it a moment? Usually it's instant.
      const payments = await getSubscriptionPayments(subscription.id);
      const firstPayment = payments[0];

      return {
        success: true,
        subscriptionId: subscription.id,
        // Use the explicit invoice URL from the generated payment
        paymentUrl: firstPayment?.invoiceUrl || `https://www.asaas.com/c/${subscription.id}`,
        customerId: asaasCustomerId, 
      };
    }),

  activate: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Banco de dados indisponível");

    await updateUserById(ctx.user.id, { hasActivePlan: true });

    return { success: true, hasActivePlan: true };
  }),
});
