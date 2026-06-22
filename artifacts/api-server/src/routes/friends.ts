import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, friendRequestsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

// GET /api/friends
router.get("/friends", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);

  const requests = await db
    .select()
    .from(friendRequestsTable)
    .where(
      and(
        or(eq(friendRequestsTable.fromUserId, me.id), eq(friendRequestsTable.toUserId, me.id)),
        eq(friendRequestsTable.status, "accepted"),
      ),
    );

  const friendIds = requests.map((r) => (r.fromUserId === me.id ? r.toUserId : r.fromUserId));
  if (friendIds.length === 0) return res.json([]);

  const friends = await db
    .select()
    .from(usersTable)
    .where(sql`${usersTable.id} = ANY(${friendIds}::int[])`);

  return res.json(
    friends.map((f) => ({ id: f.id, clerkId: f.clerkId, username: f.username, displayName: f.displayName, avatarUrl: f.avatarUrl, friendStatus: "friends" })),
  );
});

// GET /api/friends/requests
router.get("/friends/requests", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);

  const requests = await db
    .select()
    .from(friendRequestsTable)
    .where(and(eq(friendRequestsTable.toUserId, me.id), eq(friendRequestsTable.status, "pending")));

  const result = await Promise.all(
    requests.map(async (r) => {
      const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.fromUserId)).limit(1);
      const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.toUserId)).limit(1);
      return {
        ...r,
        fromUser: fromUser ? { id: fromUser.id, clerkId: fromUser.clerkId, username: fromUser.username, displayName: fromUser.displayName, avatarUrl: fromUser.avatarUrl, friendStatus: null } : null,
        toUser: toUser ? { id: toUser.id, clerkId: toUser.clerkId, username: toUser.username, displayName: toUser.displayName, avatarUrl: toUser.avatarUrl, friendStatus: null } : null,
      };
    }),
  );

  return res.json(result);
});

// POST /api/friends/requests/:userId
router.post("/friends/requests/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.params.userId)).limit(1);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === me.id) return res.status(400).json({ error: "Cannot send request to yourself" });

  // Check existing
  const existing = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, me.id), eq(friendRequestsTable.toUserId, target.id)),
        and(eq(friendRequestsTable.fromUserId, target.id), eq(friendRequestsTable.toUserId, me.id)),
      ),
    )
    .limit(1);
  if (existing.length > 0) return res.status(400).json({ error: "Request already exists" });

  const [request] = await db
    .insert(friendRequestsTable)
    .values({ fromUserId: me.id, toUserId: target.id, status: "pending" })
    .returning();

  return res.status(201).json(request);
});

// DELETE /api/friends/requests/:userId (cancel or unfriend)
router.delete("/friends/requests/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.params.userId)).limit(1);
  if (!target) return res.status(404).json({ error: "User not found" });

  await db
    .delete(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, me.id), eq(friendRequestsTable.toUserId, target.id)),
        and(eq(friendRequestsTable.fromUserId, target.id), eq(friendRequestsTable.toUserId, me.id)),
      ),
    );

  return res.status(204).send();
});

// POST /api/friends/requests/:requestId/accept
router.post("/friends/requests/:requestId/accept", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const requestId = parseInt(req.params.requestId);

  const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, requestId)).limit(1);
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.toUserId !== me.id) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db
    .update(friendRequestsTable)
    .set({ status: "accepted" })
    .where(eq(friendRequestsTable.id, requestId))
    .returning();

  return res.json(updated);
});

// POST /api/friends/requests/:requestId/reject
router.post("/friends/requests/:requestId/reject", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const requestId = parseInt(req.params.requestId);

  const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, requestId)).limit(1);
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.toUserId !== me.id) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db
    .update(friendRequestsTable)
    .set({ status: "rejected" })
    .where(eq(friendRequestsTable.id, requestId))
    .returning();

  return res.json(updated);
});

export default router;
