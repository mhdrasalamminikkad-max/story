import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  summary: text("summary").notNull(),
  voiceoverUrl: text("voiceover_url"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  approvedBy: varchar("approved_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
});

export const parentSettings = pgTable("parent_settings", {
  userId: varchar("user_id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  readingTimeLimit: integer("reading_time_limit").notNull(),
  fullscreenLockEnabled: boolean("fullscreen_lock_enabled").notNull(),
  theme: varchar("theme", { length: 10 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  storyId: varchar("story_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});
