# CabOS

The operating system for the cab: a smart operator assistant designed for Cat® machine operators
(Caterpillar on-campus hackathon). Built phase by phase. See [`docs/build-plan.md`](docs/build-plan.md)
for the plan and [`tasks.md`](tasks.md) for who owns what.

> **Status:** Phase 1 (foundation) complete: monorepo, CI, API shell, domain core, edge runtime
> skeleton, design system and the `/design` living style guide. Product features arrive from Phase 2.

## Run it

Requirements: Python 3.12 via [uv](https://docs.astral.sh/uv/), Node 22+ with [pnpm](https://pnpm.io) 9.
Docker is optional.

```bash
make dev          # installs deps, migrates, runs API :8000 + web :3100 (SQLite, no Docker)
make dev-docker   # same, against PostgreSQL 16 in Docker
make check        # the phase gate: lint + typecheck + tests + production build
make help         # all targets
```

Then open <http://localhost:3100/design>. API health: <http://localhost:8000/api/v1/health>,
API docs: <http://localhost:8000/api/v1/docs>.

## Layout

| Path | What |
|---|---|
| `apps/web` | Next.js 16 app (TypeScript strict, Tailwind v4, Motion, next-intl) |
| `services/api` | FastAPI: REST `/api/v1`, persistence (SQLite or Postgres), Alembic |
| `services/edge-sim` | Machine simulator and safety runtime |
| `packages/cabos-core` | Pure-Python domain logic shared by the services (no I/O, deterministic) |
| `config/` | Safety timings, forecast priors, task families, header synonyms (validated on load) |
| `data/provided/` | The organisers' sample CSVs, verbatim |
| `docs/` | Brief, architecture, design system, build plan, decisions (ADRs) |

## Docs

- [Architecture](docs/architecture.md): data flows, events, schema, API, state machines
- [Design system](docs/design.md): tokens, themes, interaction specs
- [Decisions](docs/decisions.md): every deviation from the brief, with reasons
