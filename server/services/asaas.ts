import "dotenv/config";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || "sandbox";
const ASAAS_BASE_URL = ASAAS_ENVIRONMENT === "production" 
  ? "https://api.asaas.com/v3" 
  : "https://sandbox.asaas.com/api/v3";

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "EXPIRED" | "OVERDUE";
}

interface CreateCustomerInput {
  name: string;
  email: string;
  cpfCnpj?: string;
}

interface CreateSubscriptionInput {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "YEARLY";
  description?: string;
}

async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${ASAAS_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "access_token": ASAAS_API_KEY,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.description || `Asaas API error: ${response.status}`);
  }

  return response.json();
}

export async function createAsaasCustomer(input: CreateCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createAsaasSubscription(input: CreateSubscriptionInput): Promise<AsaasSubscription> {
  return asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch(`/subscriptions/${subscriptionId}`);
}

export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

export async function getAsaasPayment(paymentId: string) {
  return asaasFetch(`/payments/${paymentId}`);
}
