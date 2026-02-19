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
  - `ghcr.io/Kronborgs/politracker-api:<VERSION>` + `latest`
  - `ghcr.io/Kronborgs/politracker-ollama:<VERSION>` + `latest`
  - `ghcr.io/Kronborgs/politracker-web:<VERSION>` + `latest`
- Opretter Git tag + GitHub Release
- Bager build metadata ind i images via build args:
  - `APP_VERSION`, `GIT_SHA`, `BUILD_TIME`

### GHCR owner

Denne repo er sat til owner `Kronborgs` i:
- `.github/workflows/ci.yml`
- `infra/unraid-template.xml`

## Unraid + Reverse Proxy

- Brug `infra/unraid-template.xml` for tre containere:
  - `politracker-ollama` (port 11434, GPU)
  - `politracker-api` (port 8080)
  - `politracker-web` (port 3000)
- Kør Postgres/Qdrant/Ollama som separate Unraid apps eller stacks.
- TLS termineres i eksisterende reverse proxy (SWAG/NPM/Traefik).
- Proxy web til: `http://politracker-web:3000`
- Valgfrit proxy `/api` til: `http://politracker-api:8080`
- Brug custom docker network (fx `proxynet`) så proxy kan nå containers.
- Certifikater håndteres af reverse proxy.

### Unraid felt-guide (hurtig udfyldning)

#### politracker-ollama (GPU)
- Name: `politracker-ollama`
- Repository: `ghcr.io/Kronborgs/politracker-ollama:latest`
- Registry URL: `https://ghcr.io`
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Extra Parameters: `--gpus=all`
- Port: `11434`
- Path mount: `/root/.ollama` -> `/mnt/user/appdata/politracker/ollama`
- Variables:
  - `EMBED_MODEL=nomic-embed-text`
  - `LLM_MODEL=qwen2.5:7b-instruct`
  - `PULL_ON_START=true`

Denne image starter Ollama og kører automatisk `ollama pull` for embed + llm model ved boot (hvis `PULL_ON_START=true`).

#### politracker-api
- Name: `politracker-api`
- Repository: `ghcr.io/Kronborgs/politracker-api:latest`
- Registry URL: `https://ghcr.io`
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Port: `8080`
- Path mount: `/app/apps/api/data` -> `/mnt/user/appdata/politracker/api`
- Krævede env vars: `DATABASE_URL`, `QDRANT_URL`, `OLLAMA_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

#### politracker-web
- Name: `politracker-web`
- Repository: `ghcr.io/Kronborgs/politracker-web:latest`
- Registry URL: `https://ghcr.io`
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Port: `3000`
- Krævede env vars: `NEXT_PUBLIC_API_BASE_URL`, `API_INTERNAL_BASE_URL`

## Unraid “Add Container” (felt-for-felt)

Når du klikker **Add Container** i Unraid, brug disse værdier.

### A) Ollama (med model auto-pull + GPU)
- Template: `Default`
- Name: `politracker-ollama`
- Overview: `Ollama runtime med auto-pull af modeller`
- Additional Requirements: `NVIDIA GPU plugin installeret i Unraid`
- Repository: `ghcr.io/Kronborgs/politracker-ollama:latest`
- Registry URL: `https://ghcr.io`
- Icon URL: `https://raw.githubusercontent.com/ollama/ollama/main/docs/logo.png`
- WebUI: `http://[IP]:[PORT:11434]`
- Extra Parameters: `--gpus=all`
- Post Arguments: *(tom)*
- CPU Pinning: valgfri
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Add allocations:
  - Port: `11434` -> `11434` (TCP)
  - Path: `/root/.ollama` -> `/mnt/user/appdata/politracker/ollama`
  - Variable: `EMBED_MODEL=nomic-embed-text`
  - Variable: `LLM_MODEL=qwen2.5:7b-instruct`
  - Variable: `PULL_ON_START=true`

### B) API
- Template: `Default`
- Name: `politracker-api`
- Repository: `ghcr.io/Kronborgs/politracker-api:latest`
- Registry URL: `https://ghcr.io`
- WebUI: `http://[IP]:[PORT:8080]/health`
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Add allocations:
  - Port: `8080` -> `8080` (TCP)
  - Path: `/app/apps/api/data` -> `/mnt/user/appdata/politracker/api`
  - Variables:
    - `DATABASE_URL=postgres://postgres:postgres@postgres:5432/politracker`
    - `QDRANT_URL=http://qdrant:6333`
    - `QDRANT_COLLECTION=politracker_chunks`
    - `OLLAMA_URL=http://politracker-ollama:11434`
    - `EMBED_MODEL=nomic-embed-text`
    - `LLM_MODEL=qwen2.5:7b-instruct`
    - `ADMIN_EMAIL=admin@politracker.local`
    - `ADMIN_PASSWORD=<stærk adgangskode>`
    - `JWT_SECRET=<lang secret>`

### C) Web
- Template: `Default`
- Name: `politracker-web`
- Repository: `ghcr.io/Kronborgs/politracker-web:latest`
- Registry URL: `https://ghcr.io`
- WebUI: `http://[IP]:[PORT:3000]`
- Network Type: `Bridge`
- Console shell command: `Shell`
- Privileged: `Off`
- Add allocations:
  - Port: `3000` -> `3000` (TCP)
  - Variables:
    - `NEXT_PUBLIC_API_BASE_URL=https://dit-domæne/api`
    - `API_INTERNAL_BASE_URL=http://politracker-api:8080`

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
