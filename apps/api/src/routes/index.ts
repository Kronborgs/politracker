import {
  AnalyzeInput,
  analyzeSchema,
  ingestSchema,
  loginSchema,
  politicianSchema,
  sourcePolicyUpdateSchema,
  topicSchema,
  loadPrompt,
  MAX_SNIPPET_LEN
} from "@politracker/shared";
import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import {
  domainPolicies,
  politicians,
  sources,
  stanceChanges,
  statements,
  topics,
  users
} from "../db/schema";
import { capSnippet, chunkText, domainFromUrl, hashContent } from "../utils/text";

const promptTemplate = loadPrompt("stance_v1");

export async function registerRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  app.get("/version", async () => ({
    version: app.config.APP_VERSION,
    git_sha: app.config.GIT_SHA,
    build_time: app.config.BUILD_TIME
  }));

  app.post("/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await app.db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (!user) return reply.code(401).send({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Invalid credentials" });

    const token = await reply.jwtSign({ sub: user.id, email: user.email, role: user.role });
    return { token };
  });

  app.get("/auth/me", { preHandler: app.requireAdmin }, async (request) => {
    const me = request.user as { sub: string; email: string; role: "admin" };
    return { user: me };
  });

  app.post("/ingest", { preHandler: app.requireAdmin }, async (request, reply) => {
    const input = ingestSchema.parse(request.body);
    const domain = domainFromUrl(input.url);

    const policy =
      (await app.db.query.domainPolicies.findFirst({ where: eq(domainPolicies.domain, domain) })) ||
      (
        await app.db
          .insert(domainPolicies)
          .values({ domain, allowIngest: true, allowStoreSnippet: true, allowFulltext: false, snippetMaxLen: 240 })
          .returning()
      )[0];

    if (!policy.allowIngest) return reply.code(403).send({ error: "Domain blocked for ingest" });

    const contentHash = hashContent(input.text);
    const snippetMax = Math.min(policy.snippetMaxLen, MAX_SNIPPET_LEN);

    const existing = await app.db.query.sources.findFirst({ where: eq(sources.url, input.url) });
    const sourceRow = existing
      ? (
          await app.db
            .update(sources)
            .set({
              domain,
              date: input.meta?.date ? new Date(input.meta.date) : null,
              title: input.meta?.title ?? null,
              contentHash,
              metadata: input.meta ?? {},
              allowIngest: policy.allowIngest,
              allowStoreSnippet: policy.allowStoreSnippet,
              allowFulltext: policy.allowFulltext,
              snippetMaxLen: snippetMax,
              updatedAt: new Date()
            })
            .where(eq(sources.id, existing.id))
            .returning()
        )[0]
      : (
          await app.db
            .insert(sources)
            .values({
              url: input.url,
              domain,
              date: input.meta?.date ? new Date(input.meta.date) : null,
              title: input.meta?.title ?? null,
              contentHash,
              metadata: input.meta ?? {},
              allowIngest: policy.allowIngest,
              allowStoreSnippet: policy.allowStoreSnippet,
              allowFulltext: policy.allowFulltext,
              snippetMaxLen: snippetMax,
              accessTier: policy.accessTier
            })
            .returning()
        )[0];

    const chunks = chunkText(input.text, 500, 80);
    if (chunks.length === 0) return reply.code(400).send({ error: "No chunks produced" });

    const embeds = await app.ollama.embed(chunks.map((c) => c.chunk));
    await app.qdrant.ensureCollection(embeds[0].length);

    await app.qdrant.upsert(
      chunks.map((chunk, idx) => ({
        id: `${sourceRow.id}-${chunk.idx}`,
        vector: embeds[idx],
        payload: {
          snippet: sourceRow.allowStoreSnippet ? capSnippet(chunk.chunk, snippetMax) : "",
          chunk_hash: chunk.hash,
          source_url: input.url,
          domain,
          date: input.meta?.date
        }
      }))
    );

    return {
      source_id: sourceRow.id,
      chunks: chunks.length
    };
  });

  app.post("/analyze", { preHandler: app.requireAdmin }, async (request, reply) => {
    const input = analyzeSchema.parse(request.body) as AnalyzeInput;

    const [politician, topic] = await Promise.all([
      app.db.query.politicians.findFirst({ where: eq(politicians.id, input.politician_id) }),
      app.db.query.topics.findFirst({ where: eq(topics.id, input.topic_id) })
    ]);

    if (!politician || !topic) return reply.code(404).send({ error: "Politician or topic not found" });

    const [queryVector] = await app.ollama.embed([input.query]);
    const results = await app.qdrant.search(queryVector, 5);

    const evidence = results.map((r, i) => ({
      rank: i + 1,
      snippet: String(r.payload?.snippet || ""),
      source_url: String(r.payload?.source_url || ""),
      domain: String(r.payload?.domain || "")
    }));

    const prompt = `${promptTemplate}\n\nKontekst:\n${JSON.stringify(
      {
        politician: { id: politician.id, name: politician.name },
        topic: { id: topic.id, name: topic.name, slug: topic.slug },
        query: input.query,
        evidence
      },
      null,
      2
    )}`;

    let parsed;
    let raw;
    try {
      const analyzed = await app.ollama.analyze(prompt);
      parsed = analyzed.parsed;
      raw = analyzed.raw;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      if (message.startsWith("JSON_PARSE_ERROR::")) {
        app.log.error({ raw_output: message.replace("JSON_PARSE_ERROR::", "") }, "LLM returned invalid JSON");
        return reply.code(502).send({ error: "Model response parse failure" });
      }
      throw error;
    }

    const matchedSourceUrl =
      evidence.find((e) => parsed.evidence_quote && e.snippet.includes(parsed.evidence_quote.slice(0, 60)))?.source_url ||
      evidence[0]?.source_url;

    if (!matchedSourceUrl) return reply.code(400).send({ error: "No evidence found" });

    const source = await app.db.query.sources.findFirst({ where: eq(sources.url, matchedSourceUrl) });
    if (!source) return reply.code(404).send({ error: "Matched source missing in database" });

    const previous = await app.db.query.statements.findFirst({
      where: and(eq(statements.politicianId, input.politician_id), eq(statements.topicId, input.topic_id)),
      orderBy: [desc(statements.createdAt)]
    });

    const inserted = (
      await app.db
        .insert(statements)
        .values({
          politicianId: input.politician_id,
          topicId: input.topic_id,
          sourceId: source.id,
          sourceUrl: matchedSourceUrl,
          claimSummary: parsed.claim_summary,
          stanceLabel: parsed.stance_label,
          stanceScore: parsed.stance_score,
          confidence: parsed.confidence,
          evidenceQuote: capSnippet(parsed.evidence_quote, 240),
          query: input.query,
          promptVersion: "stance_v1"
        })
        .returning()
    )[0];

    if (previous && previous.id !== inserted.id) {
      const delta = inserted.stanceScore - previous.stanceScore;
      if (Math.abs(delta) >= 0.3) {
        await app.db.insert(stanceChanges).values({
          politicianId: inserted.politicianId,
          topicId: inserted.topicId,
          fromStatementId: previous.id,
          toStatementId: inserted.id,
          deltaScore: delta,
          note: `Raw model output length=${raw?.length || 0}`
        });
      }
    }

    return { statement_id: inserted.id, output: parsed };
  });

  app.get("/timeline", async (request) => {
    const query = request.query as { politician_id?: string; topic_id?: string };

    const filters: SQL[] = [];
    if (query.politician_id) filters.push(eq(statements.politicianId, query.politician_id));
    if (query.topic_id) filters.push(eq(statements.topicId, query.topic_id));

    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await app.db
      .select({
        id: statements.id,
        created_at: statements.createdAt,
        source_url: statements.sourceUrl,
        claim_summary: statements.claimSummary,
        stance_label: statements.stanceLabel,
        stance_score: statements.stanceScore,
        confidence: statements.confidence,
        evidence_quote: statements.evidenceQuote,
        query: statements.query,
        politician: {
          id: politicians.id,
          name: politicians.name,
          party: politicians.party
        },
        topic: {
          id: topics.id,
          name: topics.name,
          slug: topics.slug
        }
      })
      .from(statements)
      .innerJoin(politicians, eq(statements.politicianId, politicians.id))
      .innerJoin(topics, eq(statements.topicId, topics.id))
      .where(where)
      .orderBy(desc(statements.createdAt))
      .limit(50);

    return { items: rows };
  });

  app.get("/politicians", async () => ({
    items: await app.db.select().from(politicians).orderBy(politicians.name)
  }));

  app.post("/politicians", { preHandler: app.requireAdmin }, async (request) => {
    const data = politicianSchema.parse(request.body);
    const row = (await app.db.insert(politicians).values(data).returning())[0];
    return row;
  });

  app.put("/politicians/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const params = request.params as { id: string };
    const data = politicianSchema.partial().parse(request.body);
    const row = (
      await app.db
        .update(politicians)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(politicians.id, params.id))
        .returning()
    )[0];
    if (!row) return reply.code(404).send({ error: "Not found" });
    return row;
  });

  app.get("/topics", async () => ({
    items: await app.db.select().from(topics).orderBy(topics.name)
  }));

  app.post("/topics", { preHandler: app.requireAdmin }, async (request) => {
    const data = topicSchema.parse(request.body);
    const row = (await app.db.insert(topics).values(data).returning())[0];
    return row;
  });

  app.put("/topics/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const params = request.params as { id: string };
    const data = topicSchema.partial().parse(request.body);
    const row = (
      await app.db
        .update(topics)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(topics.id, params.id))
        .returning()
    )[0];
    if (!row) return reply.code(404).send({ error: "Not found" });
    return row;
  });

  app.get("/sources", { preHandler: app.requireAdmin }, async (request) => {
    const query = request.query as { page?: string; pageSize?: string; domain?: string; q?: string };
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));

    const filterQuery: SQL[] = [];
    if (query.domain) filterQuery.push(eq(sources.domain, query.domain));
    if (query.q) filterQuery.push(ilike(sources.url, `%${query.q}%`));

    const where = filterQuery.length > 0 ? and(...filterQuery) : undefined;

    const [items, totalRows] = await Promise.all([
      app.db
        .select()
        .from(sources)
        .where(where)
        .orderBy(desc(sources.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      app.db.select({ value: count() }).from(sources).where(where)
    ]);

    return {
      items,
      page,
      pageSize,
      total: Number(totalRows[0]?.value || 0)
    };
  });

  app.put("/sources/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const params = request.params as { id: string };
    const patch = sourcePolicyUpdateSchema.parse(request.body);

    const updateData: Record<string, unknown> = {};
    if (patch.allow_ingest !== undefined) updateData.allowIngest = patch.allow_ingest;
    if (patch.allow_store_snippet !== undefined) updateData.allowStoreSnippet = patch.allow_store_snippet;
    if (patch.allow_fulltext !== undefined) updateData.allowFulltext = patch.allow_fulltext;
    if (patch.snippet_max_len !== undefined) updateData.snippetMaxLen = patch.snippet_max_len;
    if (patch.access_tier !== undefined) updateData.accessTier = patch.access_tier;
    updateData.updatedAt = new Date();

    const source = (
      await app.db.update(sources).set(updateData).where(eq(sources.id, params.id)).returning()
    )[0];

    if (!source) return reply.code(404).send({ error: "Source not found" });

    await app.db
      .insert(domainPolicies)
      .values({
        domain: source.domain,
        allowIngest: source.allowIngest,
        allowStoreSnippet: source.allowStoreSnippet,
        allowFulltext: source.allowFulltext,
        snippetMaxLen: source.snippetMaxLen,
        accessTier: source.accessTier,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: domainPolicies.domain,
        set: {
          allowIngest: source.allowIngest,
          allowStoreSnippet: source.allowStoreSnippet,
          allowFulltext: source.allowFulltext,
          snippetMaxLen: source.snippetMaxLen,
          accessTier: source.accessTier,
          updatedAt: new Date()
        }
      });

    return source;
  });

  app.get("/admin/stats", { preHandler: app.requireAdmin }, async () => {
    const [sourceCount, statementCount, changeCount, latestIngest, latestAnalyze] = await Promise.all([
      app.db.select({ value: count() }).from(sources),
      app.db.select({ value: count() }).from(statements),
      app.db.select({ value: count() }).from(stanceChanges),
      app.db.select({ v: sources.createdAt }).from(sources).orderBy(desc(sources.createdAt)).limit(1),
      app.db.select({ v: statements.createdAt }).from(statements).orderBy(desc(statements.createdAt)).limit(1)
    ]);

    return {
      sources: Number(sourceCount[0]?.value || 0),
      statements: Number(statementCount[0]?.value || 0),
      changes: Number(changeCount[0]?.value || 0),
      latest_ingest: latestIngest[0]?.v || null,
      latest_analyze: latestAnalyze[0]?.v || null
    };
  });
}
