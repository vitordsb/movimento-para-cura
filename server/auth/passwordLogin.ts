import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { getSessionCookieOptions } from "../config/cookies";
import { sdk } from "../services/auth";

const MIN_PASSWORD_LEN = 6;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(stored: string | null | undefined, password: string) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const testHash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const normalizeRole = (role?: string) =>
  role === "ONCOLOGIST" ? "ONCOLOGIST" : "PATIENT";

export function registerPasswordAuthRoutes(app: Express) {
  // Ensure default admin exists
  const ensureAdmin = async () => {
    const adminEmail = "admin@oncoliving.com.br";
    const adminPassword = "senha123";
    const existing = await db.getUserByEmail(adminEmail);
    if (!existing) {
      const passwordHash = hashPassword(adminPassword);
      const dbConn = await db.getDb();
      if (dbConn) {
      await dbConn.insert(users).values({
        openId: adminEmail,
        email: adminEmail,
        name: "Admin OncoLiving",
        role: "ONCOLOGIST",
        hasActivePlan: true,
        hasCompletedAnamnesis: true,
        passwordHash,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });
      }
    }
  };
  ensureAdmin().catch(err => console.error("[Auth] Falha ao garantir admin padrão", err));

  // Registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, role, planChoice } = req.body ?? {};
    const emailInput = typeof email === "string" ? email.trim() : "";
    const nameInput = typeof name === "string" ? name.trim() : "";
    const passwordValue = typeof password === "string" ? password : "";
    const plan = typeof planChoice === "string" ? planChoice : "";

    if (!emailInput || !passwordValue) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    if (!nameInput) {
      return res.status(400).json({ error: "Nome de usuário é obrigatório" });
    }
    if (!plan) {
      return res.status(400).json({ error: "Selecione um plano para criar sua conta" });
    }
    if (passwordValue.length < MIN_PASSWORD_LEN) {
      return res
        .status(400)
        .json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LEN} caracteres` });
    }

    const normalizedEmail = normalizeEmail(emailInput);
    const displayName = nameInput;
    const passwordHash = hashPassword(passwordValue);
    const hasActivePlan = plan === "monthly" || plan === "annual";
    const userRole = normalizeRole(role);

    try {
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "Usuário já existe" });
      }

      const dbConn = await db.getDb();
      if (!dbConn) {
        return res.status(500).json({ error: "Banco de dados indisponível" });
      }

      await dbConn.insert(users).values({
        openId: normalizedEmail,
        email: normalizedEmail,
        name: displayName,
        role: userRole,
        hasActivePlan,
        hasCompletedAnamnesis: false,
        passwordHash,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });

      return res.status(201).json({ success: true, needsLogin: true });
    } catch (error) {
      console.error("[Auth] Registro falhou", error);
      return res.status(500).json({ error: "Falha ao registrar usuário" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const normalizedEmail = normalizeEmail(email);
    try {
      const user = await db.getUserByEmail(normalizedEmail);
      if (!user || !verifyPassword(user.passwordHash ?? undefined, password)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "Usuário",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Auth] Login falhou", error);
      return res.status(500).json({ error: "Falha ao autenticar" });
    }
  });
}
