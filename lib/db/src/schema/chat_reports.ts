import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const chatReportsTable = pgTable("chat_reports", {
  id: serial("id").primaryKey(),
  reporterUserId: integer("reporter_user_id").notNull().references(() => usersTable.id),
  reportedUserId: integer("reported_user_id").notNull().references(() => usersTable.id),
  messageKind: text("message_kind").notNull(), // global | private
  messageId: integer("message_id").notNull(),
  reason: text("reason").notNull().default("Conteúdo ofensivo"),
  status: text("status").notNull().default("pending"),
  resolution: text("resolution"),
  resolvedByUserId: integer("resolved_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export type ChatReport = typeof chatReportsTable.$inferSelect;
