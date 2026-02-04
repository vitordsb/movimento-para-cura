import type { Request, Response } from "express";
import { updateUserById, getPrisma } from "../db";
import { getAsaasPayment } from "../services/asaas";

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED";
  };
}

export async function handleAsaasWebhook(req: Request, res: Response) {
  try {
    const payload: AsaasWebhookPayload = req.body;

    console.log("[Asaas Webhook] DEBUG INFO:");
    console.log("Headers Content-Type:", req.headers["content-type"]);
    console.log("Body:", JSON.stringify(req.body));
    console.log("Payload Event:", payload.event);

    // Handle payment confirmation events
    if (payload.event === "PAYMENT_RECEIVED" || payload.event === "PAYMENT_CONFIRMED") {
      const payment = payload.payment;
      if (!payment) {
        console.warn("[Asaas Webhook] No payment data in payload");
        return res.status(400).json({ error: "No payment data" });
      }

      // Find user by Asaas subscription ID
      const subscriptionId = payment.subscription;
      if (!subscriptionId) {
        console.warn("[Asaas Webhook] No subscription ID in payment");
        return res.status(400).json({ error: "No subscription ID" });
      }

      // Find user with this subscription using Prisma
      const prisma = getPrisma();
      const user = await prisma.user.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
      });

      if (!user) {
        console.warn("[Asaas Webhook] User not found for subscription:", subscriptionId);
        return res.status(404).json({ error: "User not found" });
      }

      // Activate user's plan
      await updateUserById(user.id, { hasActivePlan: true });

      console.log("[Asaas Webhook] Activated plan for user:", user.id);
    }

    // Acknowledge webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Asaas Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
