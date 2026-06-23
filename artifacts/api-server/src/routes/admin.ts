import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, bansTable } from "@workspace/db";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { z } from "zod";
import { getOrCreateUser } from "./users";

const router = Router();

const ADMIN_PASSWORD = "0102$Namuor";

const RANK_LEVELS: Record<string, number> = {
  user: 0,
  content_creator: 1,
  hollywood: 1,
  important: 2,
  well_connected: 2,
  advisor: 3,
  co_admin: 4,
  admin: 5,
};

async function getActiveBan(userId: number) {
  const now = new Date();
  const ban = await db
    .select()
    .from(bansTable)
    .where(
      and(
        eq(bansTable.userId, userId),
        eq(bansTable.isActive, true),
        or(isNull(bansTable.expiresAt), gt(bansTable.expiresAt, now)),
      ),
    )
    .limit(1);
  return ban[0] ?? null;
}

async function toAdminUser(user: typeof usersTable.$inferSelect) {
  const ban = await getActiveBan(user.id);
  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    rank: user.rank,
    isBanned: !!ban,
    banExpiresAt: ban?.expiresAt?.toISOString() ?? null,
    banReason: ban?.reason ?? null,
  };
}

// POST /api/admin/verify — enter password to gain admin rank
router.post("/admin/verify", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({ password: z.string() });
  const { password } = schema.parse(req.body);

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "كلمة السر غير صحيحة" });
  }

  const user = await getOrCreateUser(clerkId);

  const [updated] = await db
    .update(usersTable)
    .set({ rank: "admin" })
    .where(eq(usersTable.id, user.id))
    .returning();

  return res.json({ ...updated, friendCount: 0, groupCount: 0 });
});

// GET /api/admin/users — list all users (admin + co_admin only)
router.get("/admin/users", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  if (me.rank !== "admin" && me.rank !== "co_admin") {
    return res.status(403).json({ error: "غير مصرح" });
  }

  const allUsers = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const result = await Promise.all(allUsers.map(toAdminUser));
  return res.json(result);
});

// PUT /api/admin/users/:userId/rank — set rank
router.put("/admin/users/:userId/rank", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  if (me.rank !== "admin" && me.rank !== "co_admin") {
    return res.status(403).json({ error: "غير مصرح" });
  }

  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) return res.status(400).json({ error: "معرف غير صالح" });

  const schema = z.object({
    rank: z.enum(["user", "content_creator", "hollywood", "important", "well_connected", "advisor", "co_admin", "admin"]),
  });
  const { rank } = schema.parse(req.body);

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
  if (!target) return res.status(404).json({ error: "المستخدم غير موجود" });

  // co_admin cannot assign admin rank or touch other co_admins/admins
  if (me.rank === "co_admin") {
    if (rank === "admin" || rank === "co_admin") {
      return res.status(403).json({ error: "لا يمكنك تعيين هذه الرتبة" });
    }
    if (RANK_LEVELS[target.rank] >= RANK_LEVELS["co_admin"]) {
      return res.status(403).json({ error: "لا يمكنك تعديل رتبة هذا المستخدم" });
    }
  }

  // Nobody can change the admin's rank
  if (target.rank === "admin" && me.rank !== "admin") {
    return res.status(403).json({ error: "لا يمكن تغيير رتبة المدير" });
  }

  const [updated] = await db
    .update(usersTable)
    .set({ rank })
    .where(eq(usersTable.id, targetId))
    .returning();

  return res.json(await toAdminUser(updated));
});

// POST /api/admin/users/:userId/ban — ban user
router.post("/admin/users/:userId/ban", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  if (me.rank !== "admin" && me.rank !== "co_admin") {
    return res.status(403).json({ error: "غير مصرح" });
  }

  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) return res.status(400).json({ error: "معرف غير صالح" });

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
  if (!target) return res.status(404).json({ error: "المستخدم غير موجود" });

  // Cannot ban admin
  if (target.rank === "admin") {
    return res.status(403).json({ error: "لا يمكن حظر المدير" });
  }

  // co_admin cannot ban other co_admins
  if (me.rank === "co_admin" && target.rank === "co_admin") {
    return res.status(403).json({ error: "لا يمكن حظر شريك مدير آخر" });
  }

  const schema = z.object({
    reason: z.string().optional(),
    durationHours: z.number().nullable().optional(),
  });
  const { reason, durationHours } = schema.parse(req.body);

  const expiresAt = durationHours ? new Date(Date.now() + durationHours * 3600 * 1000) : null;

  // Deactivate any existing bans
  await db
    .update(bansTable)
    .set({ isActive: false })
    .where(and(eq(bansTable.userId, targetId), eq(bansTable.isActive, true)));

  await db.insert(bansTable).values({
    userId: targetId,
    bannedBy: me.id,
    reason: reason ?? null,
    expiresAt,
    isActive: true,
  });

  return res.json(await toAdminUser(target));
});

// DELETE /api/admin/users/:userId/ban — unban user
router.delete("/admin/users/:userId/ban", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });

  const me = await getOrCreateUser(clerkId);
  if (me.rank !== "admin" && me.rank !== "co_admin") {
    return res.status(403).json({ error: "غير مصرح" });
  }

  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) return res.status(400).json({ error: "معرف غير صالح" });

  await db
    .update(bansTable)
    .set({ isActive: false })
    .where(and(eq(bansTable.userId, targetId), eq(bansTable.isActive, true)));

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
  if (!target) return res.status(404).json({ error: "المستخدم غير موجود" });

  return res.json(await toAdminUser(target));
});

export { getActiveBan };
export default router;
