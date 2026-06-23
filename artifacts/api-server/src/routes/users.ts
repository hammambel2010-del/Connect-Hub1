import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, friendRequestsTable } from "@workspace/db";
import { eq, or, and, ilike, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Helper: get or create user from Clerk ID
async function getOrCreateUser(clerkId: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (existing.length > 0) return existing[0];

  // Create a new user with a default username
  const username = `user_${clerkId.slice(-8)}`;
  const [user] = await db
    .insert(usersTable)
    .values({ clerkId, username, displayName: username })
    .returning();
  return user;
}

// Helper: map user to summary with friend status
async function toUserSummary(user: typeof usersTable.$inferSelect, currentUserId?: number) {
  let friendStatus: string | null = null;
  if (currentUserId && currentUserId !== user.id) {
    const req = await db
      .select()
      .from(friendRequestsTable)
      .where(
        or(
          and(eq(friendRequestsTable.fromUserId, currentUserId), eq(friendRequestsTable.toUserId, user.id)),
          and(eq(friendRequestsTable.fromUserId, user.id), eq(friendRequestsTable.toUserId, currentUserId)),
        ),
      )
      .limit(1);
    if (req.length > 0) {
      const r = req[0];
      if (r.status === "accepted") friendStatus = "friends";
      else if (r.status === "pending" && r.fromUserId === currentUserId) friendStatus = "pending_sent";
      else if (r.status === "pending" && r.toUserId === currentUserId) friendStatus = "pending_received";
    }
  }
  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    rank: user.rank,
    friendStatus,
  };
}

// GET /api/users/me
router.get("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const user = await getOrCreateUser(clerkId);

  const [friendCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(friendRequestsTable)
    .where(
      and(
        or(eq(friendRequestsTable.fromUserId, user.id), eq(friendRequestsTable.toUserId, user.id)),
        eq(friendRequestsTable.status, "accepted"),
      ),
    );

  return res.json({
    ...user,
    friendCount: friendCount?.count ?? 0,
    groupCount: 0,
  });
});

// PATCH /api/users/me
router.patch("/users/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    username: z.string().min(3).optional(),
    displayName: z.string().min(1).optional(),
    bio: z.string().optional(),
    age: z.number().min(13).max(120).optional(),
    avatarUrl: z.string().optional(),
    coverUrl: z.string().optional(),
  });

  const body = schema.parse(req.body);
  const user = await getOrCreateUser(clerkId);

  const [updated] = await db
    .update(usersTable)
    .set(body)
    .where(eq(usersTable.id, user.id))
    .returning();

  return res.json({ ...updated, friendCount: 0, groupCount: 0 });
});

// GET /api/users/search?q=...
router.get("/users/search", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const q = String(req.query.q ?? "");
  const limit = Math.min(Number(req.query.limit ?? 20), 50);

  const me = await getOrCreateUser(clerkId);

  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.displayName, `%${q}%`)),
        sql`${usersTable.id} != ${me.id}`,
      ),
    )
    .limit(limit);

  const results = await Promise.all(users.map((u) => toUserSummary(u, me.id)));
  return res.json(results);
});

// GET /api/users/:userId
router.get("/users/:userId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, req.params.userId))
    .limit(1);

  if (!user.length) return res.status(404).json({ error: "User not found" });

  const [friendCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(friendRequestsTable)
    .where(
      and(
        or(eq(friendRequestsTable.fromUserId, user[0].id), eq(friendRequestsTable.toUserId, user[0].id)),
        eq(friendRequestsTable.status, "accepted"),
      ),
    );

  const summary = await toUserSummary(user[0], me.id);
  return res.json({ ...user[0], ...summary, friendCount: friendCount?.count ?? 0, groupCount: 0 });
});

export { getOrCreateUser };
export default router;
