import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { db } from "../db";
import { parentSettings } from "../db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [settings] = await db
      .select()
      .from(parentSettings)
      .where(eq(parentSettings.userId, userId));

    if (!settings || !settings.isAdmin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
}
