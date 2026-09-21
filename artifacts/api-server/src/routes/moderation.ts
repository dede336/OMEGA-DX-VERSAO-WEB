import { Router } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import {
  accountBansTable, chatMessagesTable, chatNotificationsTable, chatReportsTable,
  db, globalChatMessagesTable, usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";
import { BAN_NOTICE_TITLE } from "../lib/chatPolicy.js";
import { disconnectUserForBan } from "../lib/socket.js";

const router = Router();

function isModerator(auth: { isAdmin: boolean; role: string }): boolean {
  return auth.isAdmin || auth.role === "digimon_creator";
}

function moderatorRole(auth: { isAdmin: boolean }): "admin" | "assistant" {
  return auth.isAdmin ? "admin" : "assistant";
}

router.use(requireAuth);
router.use((req, res, next) => {
  if (!isModerator(req.auth!)) { res.status(403).json({ error: "Acesso restrito à moderação." }); return; }
  next();
});

router.get("/reports", async (req, res) => {
  const status = String(req.query.status || "pending");
  const reports = await db.select({
    id: chatReportsTable.id, messageKind: chatReportsTable.messageKind,
    messageId: chatReportsTable.messageId, reason: chatReportsTable.reason,
    status: chatReportsTable.status, resolution: chatReportsTable.resolution,
    createdAt: chatReportsTable.createdAt, reportedUserId: chatReportsTable.reportedUserId,
    reportedUsername: usersTable.username,
  }).from(chatReportsTable)
    .innerJoin(usersTable, eq(chatReportsTable.reportedUserId, usersTable.id))
    .where(eq(chatReportsTable.status, status)).orderBy(desc(chatReportsTable.createdAt));

  const enriched = await Promise.all(reports.map(async (report) => {
    if (report.messageKind === "global") {
      const [message] = await db.select({ content: globalChatMessagesTable.content, deletedAt: globalChatMessagesTable.deletedAt })
        .from(globalChatMessagesTable).where(eq(globalChatMessagesTable.id, report.messageId)).limit(1);
      return { ...report, message };
    }
    const [message] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, report.messageId)).limit(1);
    return { ...report, message: message ? { content: message.content, deletedAt: null } : null };
  }));
  // O denunciante é deliberadamente omitido da resposta para preservar sigilo operacional.
  res.json({ reports: enriched });
});

router.get("/reports/:id/context", async (req, res) => {
  const id = Number(req.params.id);
  const [report] = await db.select().from(chatReportsTable).where(eq(chatReportsTable.id, id)).limit(1);
  if (!report) { res.status(404).json({ error: "Denúncia não encontrada." }); return; }
  if (report.messageKind === "global") {
    const messages = await db.select({
      id: globalChatMessagesTable.id, content: globalChatMessagesTable.content,
      createdAt: globalChatMessagesTable.createdAt, from: usersTable.username,
    }).from(globalChatMessagesTable).innerJoin(usersTable, eq(globalChatMessagesTable.fromUserId, usersTable.id))
      .orderBy(desc(globalChatMessagesTable.createdAt)).limit(100);
    res.json({ messages: messages.reverse() });
    return;
  }
  const [reported] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, report.messageId)).limit(1);
  if (!reported) { res.json({ messages: [] }); return; }
  const messages = await db.select({
    id: chatMessagesTable.id, content: chatMessagesTable.content, createdAt: chatMessagesTable.createdAt,
    fromUserId: chatMessagesTable.fromUserId, toUserId: chatMessagesTable.toUserId,
  }).from(chatMessagesTable).where(or(
    and(eq(chatMessagesTable.fromUserId, reported.fromUserId), eq(chatMessagesTable.toUserId, reported.toUserId)),
    and(eq(chatMessagesTable.fromUserId, reported.toUserId), eq(chatMessagesTable.toUserId, reported.fromUserId)),
  )).orderBy(desc(chatMessagesTable.createdAt)).limit(100);
  const ids = [reported.fromUserId, reported.toUserId];
  const names = await Promise.all(ids.map(async (userId) => {
    const [user] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    return [userId, user?.username ?? "?"] as const;
  }));
  const nameMap = new Map(names);
  res.json({ messages: messages.reverse().map((m) => ({ ...m, from: nameMap.get(m.fromUserId), to: nameMap.get(m.toUserId) })) });
});

router.post("/reports/:id/ban", async (req, res) => {
  const reportId = Number(req.params.id);
  const durationMinutes = Number(req.body?.durationMinutes);
  const reason = String(req.body?.reason || "Comportamento ofensivo").trim().slice(0, 300);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 525_600) {
    res.status(400).json({ error: "O prazo deve ficar entre 1 minuto e 1 ano." });
    return;
  }
  const [report] = await db.select().from(chatReportsTable).where(eq(chatReportsTable.id, reportId)).limit(1);
  if (!report) { res.status(404).json({ error: "Denúncia não encontrada." }); return; }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, report.reportedUserId)).limit(1);
  if (!target) { res.status(404).json({ error: "Jogador não encontrado." }); return; }
  if (target.isAdmin) { res.status(403).json({ error: "Uma conta Admin não pode ser banida por este painel." }); return; }
  if (!req.auth!.isAdmin && target.role === "digimon_creator") {
    res.status(403).json({ error: "Assistentes não podem punir outro Assistente." });
    return;
  }
  const createdByRole = moderatorRole(req.auth!);
  const expiresAt = new Date(Date.now() + durationMinutes * 60_000);
  await db.update(accountBansTable).set({ active: false, revokedAt: new Date(), revokedByUserId: req.auth!.userId })
    .where(and(eq(accountBansTable.userId, target.id), eq(accountBansTable.active, true)));
  const [ban] = await db.insert(accountBansTable).values({
    userId: target.id, reason, createdByUserId: req.auth!.userId, createdByRole, expiresAt,
  }).returning();
  const notice = `Sua conta está temporariamente suspensa para preservar um espaço respeitoso e seguro para todos. Motivo: ${reason}. O acesso será liberado em ${expiresAt.toLocaleString("pt-BR")}.`;
  await db.insert(chatNotificationsTable).values({ userId: target.id, title: BAN_NOTICE_TITLE, message: notice });
  await db.update(chatReportsTable).set({ status: "resolved", resolution: `Banimento até ${expiresAt.toISOString()}`, resolvedAt: new Date(), resolvedByUserId: req.auth!.userId })
    .where(eq(chatReportsTable.id, reportId));
  disconnectUserForBan(target.username, { title: BAN_NOTICE_TITLE, message: notice, expiresAt: expiresAt.toISOString() });
  res.json({ ok: true, ban });
});

router.post("/reports/:id/dismiss", async (req, res) => {
  const id = Number(req.params.id);
  await db.update(chatReportsTable).set({
    status: "dismissed", resolution: "Denúncia arquivada sem punição", resolvedAt: new Date(), resolvedByUserId: req.auth!.userId,
  }).where(eq(chatReportsTable.id, id));
  res.json({ ok: true });
});

router.delete("/reports/:id/global-message", async (req, res) => {
  const id = Number(req.params.id);
  const [report] = await db.select().from(chatReportsTable).where(eq(chatReportsTable.id, id)).limit(1);
  if (!report || report.messageKind !== "global") { res.status(400).json({ error: "Esta denúncia não é de mensagem pública." }); return; }
  await db.update(globalChatMessagesTable).set({ deletedAt: new Date(), deletedByUserId: req.auth!.userId })
    .where(eq(globalChatMessagesTable.id, report.messageId));
  res.json({ ok: true });
});

router.get("/bans", async (_req, res) => {
  const bans = await db.select({
    id: accountBansTable.id, userId: accountBansTable.userId, username: usersTable.username,
    reason: accountBansTable.reason, createdByRole: accountBansTable.createdByRole,
    expiresAt: accountBansTable.expiresAt, active: accountBansTable.active, createdAt: accountBansTable.createdAt,
  }).from(accountBansTable).innerJoin(usersTable, eq(accountBansTable.userId, usersTable.id))
    .orderBy(desc(accountBansTable.createdAt)).limit(100);
  res.json({ bans });
});

router.post("/bans/:id/revoke", async (req, res) => {
  const id = Number(req.params.id);
  const [ban] = await db.select().from(accountBansTable).where(eq(accountBansTable.id, id)).limit(1);
  if (!ban) { res.status(404).json({ error: "Banimento não encontrado." }); return; }
  if (!req.auth!.isAdmin && ban.createdByRole === "admin") {
    res.status(403).json({ error: "Assistentes não podem desfazer uma decisão do Admin." });
    return;
  }
  await db.update(accountBansTable).set({ active: false, revokedAt: new Date(), revokedByUserId: req.auth!.userId })
    .where(eq(accountBansTable.id, id));
  res.json({ ok: true });
});

export default router;
