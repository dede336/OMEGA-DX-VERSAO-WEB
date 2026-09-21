import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const globalChatMessagesTable = pgTable("global_chat_messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  stickerId: text("sticker_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedByUserId: integer("deleted_by_user_id").references(() => usersTable.id),
});

export type GlobalChatMessage = typeof globalChatMessagesTable.$inferSelect;
