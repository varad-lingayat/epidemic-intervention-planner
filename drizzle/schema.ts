import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const scenarios = mysqlTable("scenarios", {
  id: varchar("id", { length: 32 }).primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  graphSource: mysqlEnum("graphSource", ["synthetic", "openstreetmap"]).notNull(),
  cityName: varchar("cityName", { length: 160 }),
  configurationJson: text("configurationJson").notNull(),
  comparisonJson: text("comparisonJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const scenarioReports = mysqlTable(
  "scenarioReports",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    scenarioId: varchar("scenarioId", { length: 32 }).notNull(),
    ownerId: int("ownerId").notNull(),
    shareId: varchar("shareId", { length: 32 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    reportJson: text("reportJson").notNull(),
    plainEnglishExplanation: text("plainEnglishExplanation"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("scenario_reports_share_id_idx").on(table.shareId)]
);

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
export type ScenarioReport = typeof scenarioReports.$inferSelect;
export type InsertScenarioReport = typeof scenarioReports.$inferInsert;
