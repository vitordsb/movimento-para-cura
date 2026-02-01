import type { Express, Request, Response } from "express";
// @ts-ignore: Library has incorrect types (d.ts mismatch with esm export)
import Scrypt from "scrypt-kdf";
import { z } from "zod";
import * as db from "../db";
import { signAuthToken } from "./jwt";
import { ONE_YEAR_MS } from "../../shared/const";
import rateLimit from "express-rate-limit";

// Rate limiter for auth endpoints - prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

const MIN_PASSWORD_LEN = 6;

async function hashPassword(password: string) {
  const buffer = await Scrypt.kdf(password, { logN: 15, r: 8, p: 1 });
  return Buffer.from(buffer).toString("base64");
}

async function verifyPassword(stored: string | null | undefined, password: string) {
  if (!stored) return false;
  try {
    const buffer = Buffer.from(stored, "base64");
    return await Scrypt.verify(buffer, password);
  } catch {
    return false;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const normalizeRole = (role?: string) =>
  role === "ONCOLOGIST" ? "ONCOLOGIST" : "PATIENT";

// Relaxed password validation (letters and numbers only)
const passwordSchema = z.string()
  .min(MIN_PASSWORD_LEN, `Senha deve ter no mínimo ${MIN_PASSWORD_LEN} caracteres`)
  .regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().optional(),
  planChoice: z.enum(["free", "monthly", "annual"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerPasswordAuthRoutes(app: Express) {
  // Registration with rate limiting
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dados inválidos: " + parse.error.issues.map(i => i.message).join(", ") });
    }

    const { email, password, name, role, planChoice } = parse.data;

    if (!planChoice && role !== "ONCOLOGIST") { // Oncologists might not need plan selection in this flow
      // For now, enforcing plan for everyone or just check frontend logic
      if (!planChoice) return res.status(400).json({ error: "Selecione um plano" });
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const hasActivePlan = planChoice === "monthly" || planChoice === "annual" || planChoice === "free";
    const planType =
      planChoice === "monthly"
        ? "PAID_MONTHLY"
        : planChoice === "annual"
        ? "PAID_ANNUAL"
          : planChoice === "free"
        ? "FREE_LIMITED"
        : "TRIAL_LIMITED";
    const userRole = normalizeRole(role);

    try {
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "Usuário já existe" });
      }

      await db.createUser({
        openId: normalizedEmail,
        email: normalizedEmail,
        name,
        passwordHash,
        role: userRole,
        loginMethod: "password",
        hasActivePlan,
        hasCompletedAnamnesis: false,
        planType,
      });

      return res.status(201).json({ success: true, needsLogin: true });
    } catch (error) {
      console.error("[Auth] Registro falhou", error);
      return res.status(500).json({ error: "Falha ao registrar usuário" });
    }
  });

  // Login with rate limiting
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Email ou senha inválidos" });
    }

    const { email, password } = parse.data;
    const normalizedEmail = normalizeEmail(email);

    try {
      const user = await db.getUserByEmail(normalizedEmail);
      if (!user || !(await verifyPassword(user.passwordHash ?? undefined, password))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      await db.updateUserById(user.id, { lastSignedIn: new Date() });

      const token = await signAuthToken(
        { openId: user.openId },
        { expiresInMs: ONE_YEAR_MS }
      );

      return res.status(200).json({ success: true, token });
    } catch (error) {
      console.error("[Auth] Login falhou", error);
      return res.status(500).json({ error: "Falha ao autenticar" });
    }
  });
}
