.DEFAULT_GOAL := help

PROJECT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
COMPOSE := docker compose --env-file "$(PROJECT_DIR)/.env" -f "$(PROJECT_DIR)/docker/docker-compose.dev.yml"
SERVICE ?=
KEY ?= all
FORCE ?= 0

.PHONY: help dev run up down build logs ps shell config db-migrate db-seed academy-seed key-generate

help:
	@printf '%-24s %s\n' \
	  'make key-generate' 'Buat key internal yang kosong/placeholder pada .env' \
	  'KEY=SESSION_SECRET' 'Pilih satu key; default all juga membuat SANDBOX_BROKER_KEY' \
	  'FORCE=1' 'Ganti key lama secara eksplisit pada target key-generate' \
	  'make dev / run / up' 'Jalankan seluruh stack dengan build dan Watch' \
	  'make down' 'Hentikan stack; volume database tetap tersimpan' \
	  'make build' 'Bangun image development' \
	  'make logs' 'Ikuti log seluruh layanan (100 baris terakhir)' \
	  'make ps' 'Lihat status semua container' \
	  'make shell' 'Buka shell container aplikasi' \
	  'make config' 'Validasi Compose tanpa menampilkan nilai environment' \
	  'make db-migrate' 'Terapkan migrasi database yang tersedia' \
	  'make db-seed' 'Seed akun demo lokal dan materi Academy' \
	  'make academy-seed' 'Seed materi Academy' \
	  'SERVICE=app' 'Batasi target build/logs ke satu layanan, misalnya make logs SERVICE=app'

key-generate: export GUARDIAN_PROJECT_DIR = $(PROJECT_DIR)
key-generate: export GUARDIAN_KEY_NAME = $(KEY)
key-generate: export GUARDIAN_KEY_FORCE = $(FORCE)
key-generate:
	@docker run --rm --network none --read-only \
	  --user "$$(id -u):$$(id -g)" \
	  --mount "type=bind,source=$$GUARDIAN_PROJECT_DIR,target=/workspace" \
	  --env GUARDIAN_KEY_NAME --env GUARDIAN_KEY_FORCE \
	  --workdir /workspace node:22-alpine \
	  node scripts/generate-keys.mjs

dev run up:
	$(COMPOSE) up --build --watch

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build $(if $(strip $(SERVICE)),"$(SERVICE)")

logs:
	$(COMPOSE) logs --follow --tail=100 $(if $(strip $(SERVICE)),"$(SERVICE)")

ps:
	$(COMPOSE) ps --all

shell:
	$(COMPOSE) exec app sh

config:
	$(COMPOSE) config --quiet

db-migrate:
	$(COMPOSE) exec app bunx prisma migrate deploy

db-seed:
	$(COMPOSE) exec app bun run db:seed

academy-seed:
	$(COMPOSE) exec app bun run academy:seed
