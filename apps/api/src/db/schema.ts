import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin"]);
export const stanceLabelEnum = pgEnum("stance_label", ["for", "imod", "uklar"]);
export const accessTierEnum = pgEnum("access_tier", ["public", "restricted", "paywalled"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const politicians = pgTable("politicians", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  party: varchar("party", { length: 255 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const domainPolicies = pgTable("domain_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  allowIngest: boolean("allow_ingest").notNull().default(true),
  allowStoreSnippet: boolean("allow_store_snippet").notNull().default(true),
  allowFulltext: boolean("allow_fulltext").notNull().default(false),
  snippetMaxLen: integer("snippet_max_len").notNull().default(240),
  accessTier: accessTierEnum("access_tier").notNull().default("public"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull().unique(),
    domain: varchar("domain", { length: 255 }).notNull(),
    date: timestamp("date", { withTimezone: true }),
    title: text("title"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    allowIngest: boolean("allow_ingest").notNull().default(true),
    allowStoreSnippet: boolean("allow_store_snippet").notNull().default(true),
    allowFulltext: boolean("allow_fulltext").notNull().default(false),
    snippetMaxLen: integer("snippet_max_len").notNull().default(240),
    accessTier: accessTierEnum("access_tier").notNull().default("public"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    sourceDomainIdx: index("sources_domain_idx").on(table.domain)
  })
);

export const statements = pgTable(
  "statements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    politicianId: uuid("politician_id")
      .notNull()
      .references(() => politicians.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    sourceUrl: text("source_url").notNull(),
    claimSummary: text("claim_summary").notNull(),
    stanceLabel: stanceLabelEnum("stance_label").notNull(),
    stanceScore: doublePrecision("stance_score").notNull(),
    confidence: doublePrecision("confidence").notNull(),
    evidenceQuote: varchar("evidence_quote", { length: 240 }).notNull(),
    query: text("query").notNull(),
    promptVersion: varchar("prompt_version", { length: 64 }).notNull().default("stance_v1"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    timelineIdx: index("statements_timeline_idx").on(table.politicianId, table.topicId, table.createdAt),
    topicTimelineIdx: index("statements_topic_timeline_idx").on(table.topicId, table.createdAt)
  })
);

export const stanceChanges = pgTable("stance_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  politicianId: uuid("politician_id")
    .notNull()
    .references(() => politicians.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  fromStatementId: uuid("from_statement_id").references(() => statements.id, { onDelete: "set null" }),
  toStatementId: uuid("to_statement_id").references(() => statements.id, { onDelete: "set null" }),
  deltaScore: doublePrecision("delta_score").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
