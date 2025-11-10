import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./firebase-admin";
import { authenticateUser, type AuthRequest } from "./middleware/auth";
import { insertStorySchema, insertParentSettingsSchema, insertBookmarkSchema } from "@shared/schema";
import type { Story, ParentSettings, Bookmark } from "@shared/schema";
import { hashPIN, verifyPIN } from "./utils/crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stories endpoints
  app.get("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storiesSnapshot = await db
        .collection("stories")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const stories: Story[] = storiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Story));

      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/preview", async (req, res) => {
    try {
      const storiesSnapshot = await db
        .collection("stories")
        .limit(3)
        .get();

      const stories: Story[] = storiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Story));

      res.json(stories);
    } catch (error) {
      console.error("Error fetching preview stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const storyData = insertStorySchema.parse(req.body);

      const storyRef = await db.collection("stories").add({
        ...storyData,
        userId,
        createdAt: Date.now(),
      });

      const story: Story = {
        id: storyRef.id,
        ...storyData,
        createdAt: Date.now(),
      };

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
      const settingsDoc = await db.collection("parentSettings").doc(userId).get();

      if (!settingsDoc.exists) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }

      const settings: ParentSettings = {
        userId,
        ...settingsDoc.data(),
      } as ParentSettings;

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

      await db.collection("parentSettings").doc(userId).set({
        pinHash,
        readingTimeLimit: settingsData.readingTimeLimit,
        fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
        theme: settingsData.theme,
        userId,
      });

      const settings: ParentSettings = {
        userId,
        pinHash,
        readingTimeLimit: settingsData.readingTimeLimit,
        fullscreenLockEnabled: settingsData.fullscreenLockEnabled,
        theme: settingsData.theme,
      };

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

      const settingsDoc = await db.collection("parentSettings").doc(userId).get();

      if (!settingsDoc.exists) {
        res.status(404).json({ valid: false, error: "Settings not found" });
        return;
      }

      const settings = settingsDoc.data() as ParentSettings;
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
      const bookmarksSnapshot = await db
        .collection("bookmarks")
        .where("userId", "==", userId)
        .get();

      const storyIds: string[] = bookmarksSnapshot.docs.map((doc) => doc.data().storyId);

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

      await db.collection("bookmarks").add({
        userId,
        storyId: bookmarkData.storyId,
        createdAt: Date.now(),
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

      const bookmarksSnapshot = await db
        .collection("bookmarks")
        .where("userId", "==", userId)
        .where("storyId", "==", storyId)
        .get();

      const deletePromises = bookmarksSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
