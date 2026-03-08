# Nebula Smile — Makefile for local and CI
# Use from repo root: make <target>

.PHONY: help install verify bootstrap check-env dev dev-up dev-down down lint test build clean

help:
	@echo "Nebula Smile — targets:"
	@echo "  make install      - npm ci"
	@echo "  make bootstrap    - run scripts/bootstrap.sh"
	@echo "  make check-env    - run scripts/check_env.sh"
	@echo "  make dev          - start Next.js dev server (npm run dev)"
	@echo "  make dev-up      - start local dev stack (Supabase/Docker)"
	@echo "  make dev-down    - stop local dev stack"
	@echo "  make down        - same as dev-down"
	@echo "  make verify      - lint + test + build"
	@echo "  make lint        - npm run lint"
	@echo "  make test        - npm run test"
	@echo "  make build       - npm run build"
	@echo "  make clean       - rm -rf .next node_modules/.cache"

install:
	npm ci

verify:
	./scripts/verify_all.sh

bootstrap:
	./scripts/bootstrap.sh

check-env:
	./scripts/check_env.sh

dev-up:
	./scripts/dev_up.sh

dev-down:
	./scripts/dev_down.sh

down: dev-down

dev:
	npm run dev

lint:
	npm run lint

test:
	npm run test

build:
	npm run build

clean:
	rm -rf .next node_modules/.cache
