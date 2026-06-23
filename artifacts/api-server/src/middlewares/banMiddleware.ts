import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, bansTable } from "@workspace/db";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export function banCheckMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return next();

    // Skip for health and admin/verify
    if (req.path === "/healthz" || req.path === "/admin/verify") return next();

    const [user] = await db
      .select({ id: usersTable.id, rank: usersTable.rank })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);

    if (!user) return next();

    // Admin can never be banned
    if (user.rank === "admin") return next();

    const now = new Date();
    const [ban] = await db
      .select()
      .from(bansTable)
      .where(
        and(
          eq(bansTable.userId, user.id),
          eq(bansTable.isActive, true),
          or(isNull(bansTable.expiresAt), gt(bansTable.expiresAt, now)),
        ),
      )
      .limit(1);

    if (ban) {
      return res.status(403).json({
        error: "حسابك محظور",
        reason: ban.reason ?? undefined,
        expiresAt: ban.expiresAt?.toISOString() ?? null,
      });
    }

    next();
  };
}
