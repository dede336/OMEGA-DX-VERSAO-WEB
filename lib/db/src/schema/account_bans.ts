import { boolean, pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const accountBansTable = pgTable("account_bans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  reason: text("reason").notNull(),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id),
  createdByRole: text("created_by_role").notNull(), // admin
  expiresAt: timestamp("expires_at").notNull(),
  active: boolean("active").notNull().default(true),
  revokedByUserId: integer("revoked_by_user_id").references(() => usersTable.id),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AccountBan = typeof accountBansTable.$inferSelect;
