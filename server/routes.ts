import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticateUser, type AuthRequest } from "./middleware/auth";
import { insertStorySchema, insertParentSettingsSchema, insertBookmarkSchema } from "@shared/schema";
import type { Story, ParentSettings, Bookmark } from "@shared/schema";
import { hashPIN, verifyPIN } from "./utils/crypto";

const stories: Story[] = [];
const parentSettings: Map<string, ParentSettings> = new Map();
const bookmarks: Bookmark[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Stories endpoints
  app.get("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const userStories = stories
        .filter(s => s.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
      res.json(userStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/preview", async (req, res) => {
    try {
      const previewStories = stories.slice(0, 3);
      res.json(previewStories);
    } catch (error) {
      console.error("Error fetching preview stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storyData = insertStorySchema.parse(req.body);

      const story: Story = {
        id: `story-${Date.now()}`,
        ...storyData,
        userId,
        createdAt: Date.now(),
      };

      stories.push(story);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Parent settings endpoints
  app.get("/api/parent-settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const settings = parentSettings.get(userId);

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

      const settings: ParentSettings = {
        userId,
        pinHash,
        readingTimeLimit: settingsData.readingTimeLimit,
        fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
        theme: settingsData.theme,
      };

      parentSettings.set(userId, settings);
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

      const settings = parentSettings.get(userId);

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
      const userBookmarks = bookmarks.filter(b => b.userId === userId);
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

      const bookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        userId,
        storyId: bookmarkData.storyId,
        createdAt: Date.now(),
      };

      bookmarks.push(bookmark);
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

      const index = bookmarks.findIndex(b => b.userId === userId && b.storyId === storyId);
      if (index !== -1) {
        bookmarks.splice(index, 1);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
