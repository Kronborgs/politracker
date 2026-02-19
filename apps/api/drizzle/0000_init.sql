CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."stance_label" AS ENUM('for', 'imod', 'uklar');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."access_tier" AS ENUM('public', 'restricted', 'paywalled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "email" varchar(255) NOT NULL,
 "password_hash" text NOT NULL,
 "role" "user_role" DEFAULT 'admin' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "politicians" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" varchar(255) NOT NULL,
 "party" varchar(255),
 "active" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "topics" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" varchar(255) NOT NULL,
 "slug" varchar(255) NOT NULL,
 "description" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "domain_policies" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "domain" varchar(255) NOT NULL,
 "allow_ingest" boolean DEFAULT true NOT NULL,
 "allow_store_snippet" boolean DEFAULT true NOT NULL,
 "allow_fulltext" boolean DEFAULT false NOT NULL,
 "snippet_max_len" integer DEFAULT 240 NOT NULL,
 "access_tier" "access_tier" DEFAULT 'public' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "domain_policies_domain_unique" UNIQUE("domain")
);

CREATE TABLE IF NOT EXISTS "sources" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "url" text NOT NULL,
 "domain" varchar(255) NOT NULL,
 "date" timestamp with time zone,
 "title" text,
 "content_hash" varchar(64) NOT NULL,
 "metadata" jsonb DEFAULT '{}'::jsonb,
 "allow_ingest" boolean DEFAULT true NOT NULL,
 "allow_store_snippet" boolean DEFAULT true NOT NULL,
 "allow_fulltext" boolean DEFAULT false NOT NULL,
 "snippet_max_len" integer DEFAULT 240 NOT NULL,
 "access_tier" "access_tier" DEFAULT 'public' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "sources_url_unique" UNIQUE("url")
);

CREATE TABLE IF NOT EXISTS "statements" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "politician_id" uuid NOT NULL,
 "topic_id" uuid NOT NULL,
 "source_id" uuid NOT NULL,
 "source_url" text NOT NULL,
 "claim_summary" text NOT NULL,
 "stance_label" "stance_label" NOT NULL,
 "stance_score" double precision NOT NULL,
 "confidence" double precision NOT NULL,
 "evidence_quote" varchar(240) NOT NULL,
 "query" text NOT NULL,
 "prompt_version" varchar(64) DEFAULT 'stance_v1' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stance_changes" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "politician_id" uuid NOT NULL,
 "topic_id" uuid NOT NULL,
 "from_statement_id" uuid,
 "to_statement_id" uuid,
 "delta_score" double precision NOT NULL,
 "note" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "statements" ADD CONSTRAINT "statements_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "statements" ADD CONSTRAINT "statements_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "statements" ADD CONSTRAINT "statements_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "stance_changes" ADD CONSTRAINT "stance_changes_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "stance_changes" ADD CONSTRAINT "stance_changes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "stance_changes" ADD CONSTRAINT "stance_changes_from_statement_id_statements_id_fk" FOREIGN KEY ("from_statement_id") REFERENCES "public"."statements"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
 ALTER TABLE "stance_changes" ADD CONSTRAINT "stance_changes_to_statement_id_statements_id_fk" FOREIGN KEY ("to_statement_id") REFERENCES "public"."statements"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "sources_domain_idx" ON "sources" USING btree ("domain");
CREATE INDEX IF NOT EXISTS "statements_timeline_idx" ON "statements" USING btree ("politician_id","topic_id","created_at");
CREATE INDEX IF NOT EXISTS "statements_topic_timeline_idx" ON "statements" USING btree ("topic_id","created_at");
