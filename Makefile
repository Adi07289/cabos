SHELL := /bin/bash
export PATH := $(HOME)/.local/bin:$(PATH)
UV ?= uv
PNPM ?= pnpm
API_PORT ?= 8000
WEB_PORT ?= 3100

.PHONY: help setup dev dev-api dev-web dev-docker migrate lint typecheck test test-py test-web build check fmt clean

help: ## List targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-12s %s\n", $$1, $$2}'

setup: ## Install Python (uv) and web (pnpm) dependencies
	$(UV) sync --all-packages
	$(PNPM) install

migrate: ## Apply database migrations (SQLite unless DATABASE_URL is set)
	cd services/api && $(UV) run alembic upgrade head

dev: setup migrate ## Run API (:8000) and web (:3100) together, no Docker needed
	@trap 'kill 0' INT TERM EXIT; \
	$(MAKE) --no-print-directory dev-api & \
	$(MAKE) --no-print-directory dev-web & \
	wait

dev-api:
	$(UV) run uvicorn cabos_api.main:create_app --factory --reload --port $(API_PORT) --app-dir services/api/src

dev-web:
	$(PNPM) --filter web exec next dev -p $(WEB_PORT)

dev-docker: ## Same as dev, but against Postgres in Docker
	docker compose up -d --wait postgres
	DATABASE_URL=postgresql+psycopg://cabos:cabos@localhost:5432/cabos $(MAKE) dev

lint: ## ruff + eslint
	$(UV) run ruff check .
	$(UV) run ruff format --check .
	$(PNPM) lint

typecheck: ## mypy (strict on cabos-core) + tsc
	$(UV) run mypy packages/cabos-core/src services/api/src services/edge-sim/src
	$(PNPM) typecheck

test-py:
	$(UV) run pytest

test-web:
	$(PNPM) test

test: test-py test-web ## pytest + vitest

build: ## Production build of the web app
	$(PNPM) build

check: lint typecheck test build ## Phase gate: everything must be green

fmt: ## Auto-format
	$(UV) run ruff check --fix .
	$(UV) run ruff format .
	$(PNPM) --filter web exec prettier --write .

clean:
	rm -rf .venv node_modules apps/web/node_modules apps/web/.next var .mypy_cache .ruff_cache .pytest_cache
