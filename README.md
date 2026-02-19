# politracker

Containeriseret monorepo til politiker-udsagn med:
- Fastify API (TypeScript)
- Next.js WebUI (App Router, TypeScript)
- Postgres
- Qdrant
- Ollama

## Repo struktur

```txt
/apps/api
/apps/web
/packages/shared
/infra/docker-compose.yml
/infra/unraid-template.xml
/.github/workflows/ci.yml
/.env.example
```

## Fil-liste (hovedfiler)

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.env.example`
- `.github/workflows/ci.yml`
- `apps/api/Dockerfile`
- `apps/api/drizzle.config.ts`
- `apps/api/drizzle/0000_init.sql`
- `apps/api/src/server.ts`
- `apps/api/src/app.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/services/ollama.ts`
- `apps/api/src/services/qdrant.ts`
- `apps/api/src/db/schema.ts`
- `apps/web/Dockerfile`
- `apps/web/next.config.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/admin/*`
- `apps/web/app/api/proxy/[...path]/route.ts`
- `packages/shared/src/schemas.ts`
- `packages/shared/src/prompts/stance_v1.txt`
- `infra/docker-compose.yml`
- `infra/unraid-template.xml`

## Kom hurtigt i gang

1. Kopiér miljøfil:

```bash
cp .env.example .env
```

2. Start alle services:

```bash
docker compose up -d --build
```

3. URL'er:
- WebUI: http://localhost:3000
- API: http://localhost:8080

## Miljøvariabler

Vigtige variabler (se også `.env.example`):

- `PORT=8080`
- `WEB_PORT=3000`
- `DATABASE_URL`
- `QDRANT_URL`
- `QDRANT_COLLECTION=politracker_chunks`
- `OLLAMA_URL`
- `EMBED_MODEL=nomic-embed-text`
- `LLM_MODEL=qwen2.5:7b-instruct`
- `APP_VERSION`
- `GIT_SHA`
- `BUILD_TIME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

## API endpoints

- `GET /health` -> `{ ok: true }`
- `GET /version` -> `{ version, git_sha, build_time }`
- `POST /auth/login` -> `{ token }`
- `GET /auth/me` (ADMIN)
- `POST /ingest` (ADMIN)
- `POST /analyze` (ADMIN)
- `GET /timeline?politician_id=&topic_id=`
- `GET/POST/PUT /politicians` (POST/PUT ADMIN)
- `GET/POST/PUT /topics` (POST/PUT ADMIN)
- `GET /sources` (ADMIN, pagineret + filter)
- `PUT /sources/:id` (ADMIN, domain policy flags)
- `GET /admin/stats` (ADMIN)

## Data compliance

- Fuld paywalled tekst gemmes ikke.
- Qdrant payload gemmer kun snippet (maks 240 tegn) + `chunk_hash` + metadata (`url/domain/date`).
- Postgres gemmer `sources` metadata + `content_hash`, samt `statements` med `evidence_quote` maks 240.
- Domain policy ligger i `domain_policies` + source-flags:
  - `allow_ingest`
  - `allow_store_snippet` (default true)
  - `allow_fulltext` (default false)
  - `snippet_max_len` (max 240)

## Versionering + GitHub Actions

Workflow: `.github/workflows/ci.yml`

- Trigger: `push` til `main` + `workflow_dispatch`
- Versionsformat: `vMAJOR.MINOR.<run_number>`
  - `MAJOR_VERSION` og `MINOR_VERSION` kan sættes som GitHub Repository Variables
  - defaults: `0` og `1`
- Bygger og pusher images til GHCR:
  - `ghcr.io/OWNER/politracker-api:<VERSION>` + `latest`
  - `ghcr.io/OWNER/politracker-web:<VERSION>` + `latest`
- Opretter Git tag + GitHub Release
- Bager build metadata ind i images via build args:
  - `APP_VERSION`, `GIT_SHA`, `BUILD_TIME`

### OWNER placeholder

Erstat `OWNER` med dit GitHub owner-navn i:
- `.github/workflows/ci.yml`
- `infra/unraid-template.xml`

## Unraid + Reverse Proxy

- Brug `infra/unraid-template.xml` for to containere:
  - `politracker-api` (port 8080)
  - `politracker-web` (port 3000)
- Kør Postgres/Qdrant/Ollama som separate Unraid apps eller stacks.
- TLS termineres i eksisterende reverse proxy (SWAG/NPM/Traefik).
- Proxy web til: `http://politracker-web:3000`
- Valgfrit proxy `/api` til: `http://politracker-api:8080`
- Brug custom docker network (fx `proxynet`) så proxy kan nå containers.
- Certifikater håndteres af reverse proxy.

## Noter om drift

- API kører Drizzle migrations automatisk ved container start (`pnpm db:migrate`).
- API seed'er initial admin fra `ADMIN_EMAIL` + `ADMIN_PASSWORD` ved første boot.
- Første `analyze/ingest` kræver at Ollama-model(ler) er tilgængelige i Ollama.

## Next steps

- Auth hardening (refresh tokens, CSRF, secure cookies)
- Rate limiting
- Audit log
- Flere user roles
- UI til automatisk ændringsdetektion
