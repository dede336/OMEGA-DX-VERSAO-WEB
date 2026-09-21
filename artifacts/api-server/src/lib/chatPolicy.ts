import { and, desc, eq, gt } from "drizzle-orm";
import { accountBansTable, db } from "@workspace/db";
import { containsProfanity } from "./profanity.js";

export const CHAT_UNIT_LIMIT = 50;
export const STICKER_SIZE = 50;
export const BAN_NOTICE_TITLE = "Uma pausa para proteger o Mundo Digital";
export const APPROVED_STICKER_IDS = new Set<string>();

export function countMessageUnits(text: string): number {
  const segmenter = new Intl.Segmenter("pt-BR", { granularity: "word" });
  let count = 0;
  for (const part of segmenter.segment(text.trim())) {
    if (part.isWordLike || /\p{Extended_Pictographic}/u.test(part.segment)) count += 1;
  }
  return count;
}

export function validateChatContent(content: unknown): string | null {
  if (typeof content !== "string" || !content.trim()) return "Digite uma mensagem.";
  if (content.length > 2000) return "Mensagem muito longa.";
  if (countMessageUnits(content) > CHAT_UNIT_LIMIT) return `Use no máximo ${CHAT_UNIT_LIMIT} palavras ou emojis.`;
  if (containsProfanity(content)) return "A mensagem contém linguagem ofensiva e não foi enviada.";
  return null;
}

export async function getActiveAccountBan(userId: number) {
  const [ban] = await db.select().from(accountBansTable).where(and(
    eq(accountBansTable.userId, userId), eq(accountBansTable.active, true), gt(accountBansTable.expiresAt, new Date()),
  )).orderBy(desc(accountBansTable.createdAt)).limit(1);
  return ban ?? null;
}

const recentSends = new Map<number, number[]>();
export function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const recent = (recentSends.get(userId) ?? []).filter((time) => now - time < 10_000);
  if (recent.length >= 8) { recentSends.set(userId, recent); return true; }
  recent.push(now); recentSends.set(userId, recent); return false;
}
