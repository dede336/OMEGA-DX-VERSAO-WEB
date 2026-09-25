import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getActiveAccountBan } from "../lib/chatPolicy.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
  role: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const token = header.slice(7);
  try {
    const secret = process.env["SESSION_SECRET"]!;
    const payload = jwt.verify(token, secret) as AuthPayload;
    const [user] = await db.select({ activeSessionId: usersTable.activeSessionId })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!user || !payload.sessionId || !user.activeSessionId || user.activeSessionId !== payload.sessionId) {
      res.status(401).json({ error: "Sessão encerrada. Entre novamente." });
      return;
    }
    const ban = await getActiveAccountBan(payload.userId);
    if (ban) {
      res.status(403).json({
        code: "ACCOUNT_BANNED",
        error: `Sua conta está temporariamente suspensa. Motivo: ${ban.reason}. Liberação prevista para ${ban.expiresAt.toLocaleString("pt-BR")}.`,
        title: "Uma pausa para proteger o Mundo Digital",
        message: `Sua conta está temporariamente suspensa para preservar um espaço respeitoso e seguro para todos. Motivo: ${ban.reason}`,
        expiresAt: ban.expiresAt.toISOString(),
      });
      return;
    }
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
