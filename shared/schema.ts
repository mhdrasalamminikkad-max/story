import { z } from "zod";

// Story schema for bedtime stories
export const storySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  imageUrl: z.string(),
  summary: z.string(),
  createdAt: z.number(),
  isBookmarked: z.boolean().optional(),
});

export const insertStorySchema = storySchema.omit({ id: true, createdAt: true, userId: true, isBookmarked: true });

export type Story = z.infer<typeof storySchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;

// Parent settings schema for child lock and preferences
export const parentSettingsSchema = z.object({
  userId: z.string(),
  pinHash: z.string(),
  readingTimeLimit: z.number().min(10).max(60),
  fullscreenLockEnabled: z.boolean(),
  theme: z.enum(["day", "night"]),
});

export const insertParentSettingsSchema = z.object({
  pin: z.string().length(4),
  readingTimeLimit: z.number().min(10).max(60),
  fullscreenLockEnabled: z.boolean(),
  theme: z.enum(["day", "night"]),
});

export type ParentSettings = z.infer<typeof parentSettingsSchema>;
export type InsertParentSettings = z.infer<typeof insertParentSettingsSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storyId: z.string(),
  createdAt: z.number(),
});

export const insertBookmarkSchema = z.object({
  storyId: z.string(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
