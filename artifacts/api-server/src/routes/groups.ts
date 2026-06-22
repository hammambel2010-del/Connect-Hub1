import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, groupsTable, groupMembersTable, messagesTable } from "@workspace/db";
import { eq, and, ilike, desc, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrCreateUser } from "./users";

const router = Router();

async function getGroupWithMeta(groupId: number, userId?: number) {
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group) return null;

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId));

  let myRole: string | null = null;
  if (userId) {
    const [membership] = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)))
      .limit(1);
    myRole = membership?.role ?? null;
  }

  return { ...group, memberCount: memberCount?.count ?? 0, myRole };
}

// GET /api/groups
router.get("/groups", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);

  const memberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, me.id));

  const groups = await Promise.all(
    memberships.map(async (m) => {
      const g = await getGroupWithMeta(m.groupId, me.id);
      return g;
    }),
  );

  return res.json(groups.filter(Boolean));
});

// POST /api/groups
router.post("/groups", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);

  const schema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    isPublic: z.boolean().default(true),
  });

  const body = schema.parse(req.body);

  const [group] = await db
    .insert(groupsTable)
    .values({ ...body, creatorId: me.id })
    .returning();

  // Add creator as admin
  await db.insert(groupMembersTable).values({ groupId: group.id, userId: me.id, role: "admin" });

  return res.status(201).json({ ...group, memberCount: 1, myRole: "admin" });
});

// GET /api/groups/search
router.get("/groups/search", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const q = String(req.query.q ?? "");
  const limit = Math.min(Number(req.query.limit ?? 20), 50);

  const groups = await db
    .select()
    .from(groupsTable)
    .where(and(eq(groupsTable.isPublic, true), ilike(groupsTable.name, `%${q}%`)))
    .limit(limit);

  const result = await Promise.all(groups.map((g) => getGroupWithMeta(g.id, me.id)));
  return res.json(result.filter(Boolean));
});

// GET /api/groups/:groupId
router.get("/groups/:groupId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);
  const group = await getGroupWithMeta(groupId, me.id);
  if (!group) return res.status(404).json({ error: "Group not found" });

  return res.json(group);
});

// PATCH /api/groups/:groupId
router.patch("/groups/:groupId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)))
    .limit(1);

  if (!membership || membership.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const schema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    isPublic: z.boolean().optional(),
  });

  const body = schema.parse(req.body);
  await db.update(groupsTable).set(body).where(eq(groupsTable.id, groupId));

  const group = await getGroupWithMeta(groupId, me.id);
  return res.json(group);
});

// DELETE /api/groups/:groupId
router.delete("/groups/:groupId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)))
    .limit(1);

  if (!membership || membership.role !== "admin") return res.status(403).json({ error: "Admin only" });

  await db.delete(groupsTable).where(eq(groupsTable.id, groupId));
  return res.status(204).send();
});

// POST /api/groups/:groupId/join
router.post("/groups/:groupId/join", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (!group.isPublic) return res.status(403).json({ error: "Group is private" });

  const [existing] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)))
    .limit(1);

  if (!existing) {
    await db.insert(groupMembersTable).values({ groupId, userId: me.id, role: "member" });
  }

  return res.json(await getGroupWithMeta(groupId, me.id));
});

// POST /api/groups/:groupId/leave
router.post("/groups/:groupId/leave", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  await db
    .delete(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)));

  return res.status(204).send();
});

// GET /api/groups/:groupId/members
router.get("/groups/:groupId/members", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const groupId = parseInt(req.params.groupId);

  const members = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId));

  const result = await Promise.all(
    members.map(async (m) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId)).limit(1);
      if (!user) return null;
      return {
        user: { id: user.id, clerkId: user.clerkId, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, friendStatus: null },
        role: m.role,
        joinedAt: m.joinedAt,
      };
    }),
  );

  return res.json(result.filter(Boolean));
});

// GET /api/groups/:groupId/messages
router.get("/groups/:groupId/messages", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)))
    .limit(1);

  if (!membership) return res.status(403).json({ error: "Not a member" });

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const before = req.query.before ? Number(req.query.before) : undefined;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.groupId, groupId), before ? lt(messagesTable.id, before) : undefined))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const result = await Promise.all(
    messages.reverse().map(async (msg) => {
      const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, msg.senderId)).limit(1);
      return {
        ...msg,
        sender: sender
          ? { id: sender.id, clerkId: sender.clerkId, username: sender.username, displayName: sender.displayName, avatarUrl: sender.avatarUrl, friendStatus: null }
          : null,
      };
    }),
  );

  return res.json(result);
});

// POST /api/groups/:groupId/messages
router.post("/groups/:groupId/messages", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const groupId = parseInt(req.params.groupId);

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, me.id)))
    .limit(1);

  if (!membership) return res.status(403).json({ error: "Not a member" });

  const schema = z.object({
    content: z.string().min(1),
    mediaUrl: z.string().optional(),
    mediaType: z.enum(["image", "video"]).optional(),
  });

  const body = schema.parse(req.body);

  const [message] = await db
    .insert(messagesTable)
    .values({ senderId: me.id, groupId, content: body.content, mediaUrl: body.mediaUrl, mediaType: body.mediaType })
    .returning();

  return res.status(201).json({
    ...message,
    sender: { id: me.id, clerkId: me.clerkId, username: me.username, displayName: me.displayName, avatarUrl: me.avatarUrl, friendStatus: null },
  });
});

export default router;
