import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, messagesTable } from "@workspace/db";
import { eq, and, or, desc, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrCreateUser } from "./users";

const router = Router();

// GET /api/conversations
router.get("/conversations", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);

  // Get latest message for each conversation partner
  const latestMessages = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        sql`${messagesTable.groupId} IS NULL`,
        or(eq(messagesTable.senderId, me.id), eq(messagesTable.recipientId, me.id)),
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(100);

  // Group by conversation partner
  const conversationMap = new Map<number, typeof latestMessages[0]>();
  for (const msg of latestMessages) {
    const partnerId = msg.senderId === me.id ? msg.recipientId! : msg.senderId;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg);
    }
  }

  const result = await Promise.all(
    Array.from(conversationMap.entries()).map(async ([partnerId, lastMsg]) => {
      const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId)).limit(1);
      if (!partner) return null;
      return {
        user: { id: partner.id, clerkId: partner.clerkId, username: partner.username, displayName: partner.displayName, avatarUrl: partner.avatarUrl, friendStatus: null },
        lastMessage: {
          ...lastMsg,
          sender: { id: partner.id, clerkId: partner.clerkId, username: partner.username, displayName: partner.displayName, avatarUrl: partner.avatarUrl, friendStatus: null },
        },
        unreadCount: 0,
      };
    }),
  );

  return res.json(result.filter(Boolean));
});

// GET /api/conversations/:userId
router.get("/conversations/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.params.userId)).limit(1);
  if (!partner) return res.status(404).json({ error: "User not found" });

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const before = req.query.before ? Number(req.query.before) : undefined;

  let query = db
    .select()
    .from(messagesTable)
    .where(
      and(
        sql`${messagesTable.groupId} IS NULL`,
        or(
          and(eq(messagesTable.senderId, me.id), eq(messagesTable.recipientId, partner.id)),
          and(eq(messagesTable.senderId, partner.id), eq(messagesTable.recipientId, me.id)),
        ),
        before ? lt(messagesTable.id, before) : undefined,
      ),
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const messages = await query;
  const senderMap = new Map<number, typeof partner>();
  senderMap.set(me.id, me as typeof partner);
  senderMap.set(partner.id, partner);

  const result = messages.reverse().map((msg) => {
    const sender = senderMap.get(msg.senderId)!;
    return {
      ...msg,
      sender: { id: sender.id, clerkId: sender.clerkId, username: sender.username, displayName: sender.displayName, avatarUrl: sender.avatarUrl, friendStatus: null },
    };
  });

  return res.json(result);
});

// POST /api/conversations/:userId
router.post("/conversations/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.params.userId)).limit(1);
  if (!recipient) return res.status(404).json({ error: "User not found" });

  const schema = z.object({
    content: z.string().min(1),
    mediaUrl: z.string().optional(),
    mediaType: z.enum(["image", "video"]).optional(),
  });

  const body = schema.parse(req.body);

  const [message] = await db
    .insert(messagesTable)
    .values({
      senderId: me.id,
      recipientId: recipient.id,
      content: body.content,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
    })
    .returning();

  return res.status(201).json({
    ...message,
    sender: { id: me.id, clerkId: me.clerkId, username: me.username, displayName: me.displayName, avatarUrl: me.avatarUrl, friendStatus: null },
  });
});

export default router;
