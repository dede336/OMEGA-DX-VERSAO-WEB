import { Router } from "express";
import { db, usersTable, chatMessagesTable, globalChatMessagesTable, friendshipsTable, chatReportsTable, chatNotificationsTable } from "@workspace/db";
import { eq, or, and, desc, sql, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { isUserOnline, getOnlineUsers } from "../lib/socket.js";
import { isRateLimited, validateChatContent } from "../lib/chatPolicy.js";

const router = Router();

async function areFriends(firstId: number, secondId: number): Promise<boolean> {
  const [row] = await db.select({ id: friendshipsTable.id }).from(friendshipsTable).where(and(
    eq(friendshipsTable.status, "accepted"),
    or(
      and(eq(friendshipsTable.requesterId, firstId), eq(friendshipsTable.addresseeId, secondId)),
      and(eq(friendshipsTable.requesterId, secondId), eq(friendshipsTable.addresseeId, firstId)),
    ),
  )).limit(1);
  return Boolean(row);
}

// GET /api/chat/online — list of currently online usernames
router.get("/online", requireAuth, (_req, res) => {
  res.json({ online: getOnlineUsers() });
});

// GET /api/chat/conversations — last message per conversation partner
router.get("/conversations", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  try {
    const msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(
        or(
          eq(chatMessagesTable.fromUserId, userId),
          eq(chatMessagesTable.toUserId, userId)
        )
      )
      .orderBy(desc(chatMessagesTable.createdAt));

    // Group by conversation partner
    const convMap = new Map<number, typeof msgs[0]>();
    for (const msg of msgs) {
      const partnerId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
      if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
    }

    // Fetch partner usernames and unread counts
    const result = await Promise.all(
      Array.from(convMap.entries()).map(async ([partnerId, lastMsg]) => {
        const [partner] = await db
          .select({ username: usersTable.username })
          .from(usersTable)
          .where(eq(usersTable.id, partnerId))
          .limit(1);

        // Count unread (messages sent to me, not yet read)
        const unreadRows = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatMessagesTable)
          .where(
            and(
              eq(chatMessagesTable.fromUserId, partnerId),
              eq(chatMessagesTable.toUserId, userId),
              sql`${chatMessagesTable.readAt} IS NULL`
            )
          );
        const unread = Number(unreadRows[0]?.count ?? 0);

        return {
          partnerId,
          partnerUsername: partner?.username ?? "unknown",
          lastMessage: {
            id: lastMsg.id,
            content: lastMsg.content,
            from: lastMsg.fromUserId === userId ? req.auth!.username : (partner?.username ?? ""),
            createdAt: lastMsg.createdAt.toISOString(),
          },
          unread,
          online: isUserOnline(partner?.username ?? ""),
        };
      })
    );

    res.json({ conversations: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// GET /api/chat/messages/:username — history with a specific user
router.get("/messages/:username", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const username = String(req.params.username);
  try {
    const [partner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!partner) { res.status(404).json({ error: "User not found" }); return; }
    if (!(await areFriends(userId, partner.id))) { res.status(403).json({ error: "A conversa privada é exclusiva para amigos." }); return; }

    const msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(
        or(
          and(eq(chatMessagesTable.fromUserId, userId), eq(chatMessagesTable.toUserId, partner.id)),
          and(eq(chatMessagesTable.fromUserId, partner.id), eq(chatMessagesTable.toUserId, userId))
        )
      )
      .orderBy(chatMessagesTable.createdAt);

    res.json({
      messages: msgs.map((m) => ({
        id: m.id,
        from: m.fromUserId === userId ? req.auth!.username : username,
        to: m.toUserId === userId ? req.auth!.username : username,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /api/chat/messages/:username — send a message via REST (offline fallback)
router.post("/messages/:username", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const senderUsername = req.auth!.username;
  const username = String(req.params.username);
  const { content } = req.body as { content?: string };
  const validationError = validateChatContent(content);
  if (validationError) { res.status(400).json({ error: validationError }); return; }
  if (isRateLimited(userId)) { res.status(429).json({ error: "Muitas mensagens em pouco tempo. Aguarde alguns segundos." }); return; }
  const cleanContent = content!.trim();
  try {
    const [recipient] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!recipient) { res.status(404).json({ error: "User not found" }); return; }
    if (!(await areFriends(userId, recipient.id))) { res.status(403).json({ error: "A conversa privada é exclusiva para amigos." }); return; }
    const [saved] = await db
      .insert(chatMessagesTable)
      .values({ fromUserId: userId, toUserId: recipient.id, content: cleanContent })
      .returning();
    res.json({
      message: {
        id: saved.id,
        from: senderUsername,
        to: username,
        content: saved.content,
        createdAt: saved.createdAt.toISOString(),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// POST /api/chat/messages/:username/read — mark all unread from this user as read
router.post("/messages/:username/read", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const username = String(req.params.username);
  try {
    const [partner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!partner) { res.status(404).json({ error: "User not found" }); return; }

    await db
      .update(chatMessagesTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(chatMessagesTable.fromUserId, partner.id),
          eq(chatMessagesTable.toUserId, userId),
          sql`${chatMessagesTable.readAt} IS NULL`
        )
      );

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// GET /api/chat/global — last 100 global messages
router.get("/global", requireAuth, async (_req, res) => {
  try {
    const msgs = await db
      .select({
        id: globalChatMessagesTable.id,
        content: globalChatMessagesTable.content,
        createdAt: globalChatMessagesTable.createdAt,
        from: usersTable.username,
      })
      .from(globalChatMessagesTable)
      .innerJoin(usersTable, eq(globalChatMessagesTable.fromUserId, usersTable.id))
      .where(isNull(globalChatMessagesTable.deletedAt))
      .orderBy(desc(globalChatMessagesTable.createdAt))
      .limit(100);

    res.json({ messages: msgs.reverse().map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) });
  } catch {
    res.status(500).json({ error: "Failed to load global chat" });
  }
});

// POST /api/chat/global — REST fallback for sending global message
router.post("/global", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const username = req.auth!.username;
  const { content } = req.body as { content?: string };
  const validationError = validateChatContent(content);
  if (validationError) { res.status(400).json({ error: validationError }); return; }
  if (isRateLimited(userId)) { res.status(429).json({ error: "Muitas mensagens em pouco tempo. Aguarde alguns segundos." }); return; }
  const cleanContent = content!.trim();
  try {
    const [saved] = await db
      .insert(globalChatMessagesTable)
      .values({ fromUserId: userId, content: cleanContent })
      .returning();
    res.json({
      message: { id: saved.id, from: username, content: saved.content, createdAt: saved.createdAt.toISOString() },
    });
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// POST /api/chat/report — denúncia sigilosa de mensagem pública ou privada
router.post("/report", requireAuth, async (req, res) => {
  const reporterUserId = req.auth!.userId;
  const { messageKind, messageId, reason } = req.body as { messageKind?: "global" | "private"; messageId?: number; reason?: string };
  if (!messageKind || !Number.isInteger(messageId)) { res.status(400).json({ error: "Mensagem inválida." }); return; }
  if (messageKind !== "global" && messageKind !== "private") { res.status(400).json({ error: "Tipo de mensagem inválido." }); return; }

  let reportedUserId: number | null = null;
  if (messageKind === "global") {
    const [message] = await db.select().from(globalChatMessagesTable).where(eq(globalChatMessagesTable.id, messageId!)).limit(1);
    reportedUserId = message?.fromUserId ?? null;
  } else {
    const [message] = await db.select().from(chatMessagesTable).where(and(
      eq(chatMessagesTable.id, messageId!),
      or(eq(chatMessagesTable.fromUserId, reporterUserId), eq(chatMessagesTable.toUserId, reporterUserId)),
    )).limit(1);
    reportedUserId = message?.fromUserId ?? null;
  }
  if (!reportedUserId) { res.status(404).json({ error: "Mensagem não encontrada." }); return; }
  if (reportedUserId === reporterUserId) { res.status(400).json({ error: "Você não pode denunciar sua própria mensagem." }); return; }

  const [existing] = await db.select({ id: chatReportsTable.id }).from(chatReportsTable).where(and(
    eq(chatReportsTable.reporterUserId, reporterUserId), eq(chatReportsTable.messageKind, messageKind),
    eq(chatReportsTable.messageId, messageId!), eq(chatReportsTable.status, "pending"),
  )).limit(1);
  if (existing) { res.status(409).json({ error: "Esta mensagem já foi denunciada por você." }); return; }

  await db.insert(chatReportsTable).values({
    reporterUserId, reportedUserId, messageKind, messageId: messageId!,
    reason: String(reason || "Conteúdo ofensivo").trim().slice(0, 300),
  });
  res.status(201).json({ ok: true, message: "Denúncia enviada de forma sigilosa para a moderação." });
});

router.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db.select().from(chatNotificationsTable)
    .where(eq(chatNotificationsTable.userId, req.auth!.userId))
    .orderBy(desc(chatNotificationsTable.createdAt)).limit(20);
  res.json({ notifications });
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.update(chatNotificationsTable).set({ read: true }).where(and(
    eq(chatNotificationsTable.id, id), eq(chatNotificationsTable.userId, req.auth!.userId),
  ));
  res.json({ ok: true });
});

export default router;
