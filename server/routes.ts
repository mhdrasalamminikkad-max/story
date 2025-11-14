import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticateUser, type AuthRequest } from "./middleware/auth";
import { requireAdmin } from "./middleware/adminAuth";
import { insertStorySchema, insertParentSettingsSchema, insertBookmarkSchema } from "@shared/schema";
import type { Story, ParentSettings, Bookmark } from "@shared/schema";
import { hashPIN, verifyPIN } from "./utils/crypto";
import { db } from "./db";
import { stories, parentSettings, bookmarks } from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stories endpoints
  app.get("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userStories = await db
        .select()
        .from(stories)
        .where(eq(stories.userId, userId))
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = userStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/preview", async (req, res) => {
    try {
      const previewStories = await db
        .select()
        .from(stories)
        .orderBy(desc(stories.createdAt))
        .limit(3);
      
      const storiesWithTimestamp = previewStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching preview stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storyData = insertStorySchema.parse(req.body);

      const [story] = await db
        .insert(stories)
        .values({
          id: `story-${Date.now()}`,
          ...storyData,
          userId,
        })
        .returning();
      
      const storyWithTimestamp = {
        ...story,
        createdAt: story.createdAt.getTime(),
      };
      res.json(storyWithTimestamp);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Parent settings endpoints
  app.get("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const settingsData = insertParentSettingsSchema.parse(req.body);
      
      const pinHash = hashPIN(settingsData.pin);

      // SECURITY: isAdmin is never set from client input
      // Only server-controlled fields are set here
      const [settings] = await db
        .insert(parentSettings)
        .values({
          userId,
          pinHash,
          readingTimeLimit: settingsData.readingTimeLimit,
          fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
          theme: settingsData.theme,
          isAdmin: false, // Default to false for new users
        })
        .onConflictDoUpdate({
          target: parentSettings.userId,
          set: {
            // SECURITY: isAdmin is explicitly excluded from updates
            // to prevent privilege escalation
            pinHash,
            readingTimeLimit: settingsData.readingTimeLimit,
            fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
            theme: settingsData.theme,
            // isAdmin is NOT updated here - admin promotion must be done server-side only
          },
        })
        .returning();

      res.json(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/verify-pin", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { pin } = req.body;

      if (!pin || pin.length !== 4) {
        res.status(400).json({ valid: false, error: "Invalid PIN format" });
        return;
      }

      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      if (!settings) {
        res.status(404).json({ valid: false, error: "Settings not found" });
        return;
      }

      const isValid = verifyPIN(pin, settings.pinHash);
      
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Bookmarks endpoints
  app.get("/api/bookmarks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userBookmarks = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));
      
      const storyIds: string[] = userBookmarks.map(b => b.storyId);
      res.json(storyIds);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const bookmarkData = insertBookmarkSchema.parse(req.body);

      await db
        .insert(bookmarks)
        .values({
          id: `bookmark-${Date.now()}`,
          userId,
          storyId: bookmarkData.storyId,
        });

      res.json({ success: true });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ error: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:storyId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { storyId } = req.params;

      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.storyId, storyId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  // Admin check endpoint
  app.get("/api/admin/check", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [settings] = await db
        .select()
        .from(parentSettings)
        .where(eq(parentSettings.userId, userId));

      res.json({ isAdmin: settings?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/stats", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [userCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(parentSettings);
      
      const [storyCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(stories);
      
      const [bookmarkCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookmarks);
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [recentStoriesResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(stories)
        .where(sql`${stories.createdAt} > ${sevenDaysAgo}`);

      const totalUsers = userCountResult?.count || 0;
      const totalStories = storyCountResult?.count || 0;
      const totalBookmarks = bookmarkCountResult?.count || 0;
      const recentStoriesCount = recentStoriesResult?.count || 0;

      const stats = {
        totalUsers,
        totalStories,
        totalBookmarks,
        averageStoriesPerUser: totalUsers > 0 ? (totalStories / totalUsers).toFixed(1) : "0",
        recentStoriesCount,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/stories", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allStories = await db
        .select()
        .from(stories)
        .orderBy(desc(stories.createdAt));
      
      const storiesWithTimestamp = allStories.map(s => ({
        ...s,
        createdAt: s.createdAt.getTime(),
      }));
      res.json(storiesWithTimestamp);
    } catch (error) {
      console.error("Error fetching all stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/admin/users", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allSettings = await db.select().from(parentSettings);
      
      const users = await Promise.all(
        allSettings.map(async (settings) => {
          const [storyCountResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(stories)
            .where(eq(stories.userId, settings.userId));
          
          return {
            userId: settings.userId,
            readingTimeLimit: settings.readingTimeLimit,
            fullscreenLockEnabled: settings.fullscreenLockEnabled,
            theme: settings.theme,
            storyCount: storyCountResult?.count || 0,
          };
        })
      );
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/stories/:storyId", authenticateUser, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { storyId } = req.params;
      
      const result = await db
        .delete(stories)
        .where(eq(stories.id, storyId))
        .returning();
      
      if (result.length > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Story not found" });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
