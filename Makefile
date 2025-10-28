.PHONY: help install setup dev build start test lint typecheck clean docker-up docker-down collect analyze verify

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
	@echo 'x402 Protocol Observatory - Development Commands'
	@echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ''

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@PUPPETEER_SKIP_DOWNLOAD=true npm install
	@echo "✅ Dependencies installed"

setup: install ## Complete setup (install + database + verify)
	@echo "🔧 Setting up project..."
	@if [ ! -f .env ]; then \
		echo "📄 Creating .env file..."; \
		cp .env.example .env; \
		echo "⚠️  Please edit .env with your DATABASE_URL"; \
	fi
	@echo "🗄️  Generating Prisma client..."
	@npx prisma generate 2>/dev/null || echo "⚠️  Prisma generation skipped (network issue)"
	@echo "🔍 Running setup verification..."
	@npm run verify || echo "⚠️  Some checks failed - check output above"
	@echo "✅ Setup complete!"

dev: ## Start development server
	@echo "🚀 Starting development server..."
	@npm run dev

build: ## Build for production
	@echo "🏗️  Building for production..."
	@npm run build

start: ## Start production server
	@echo "🚀 Starting production server..."
	@npm start

test: ## Run all tests
	@echo "🧪 Running tests..."
	@npm test

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	@npm test -- --watch

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	@npm test -- --coverage

lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	@npm run lint

typecheck: ## Run TypeScript type checking
	@echo "🔍 Running TypeScript type check..."
	@npx tsc --noEmit

check: lint typecheck ## Run all checks (lint + typecheck)
	@echo "✅ All checks passed!"

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf .next
	@rm -rf dist
	@rm -rf coverage
	@rm -rf node_modules
	@rm -f tsconfig.tsbuildinfo
	@echo "✅ Cleaned!"

docker-up: ## Start Docker services (database, redis, app)
	@echo "🐳 Starting Docker services..."
	@docker compose up -d
	@echo "✅ Docker services started"
	@docker compose ps

docker-down: ## Stop Docker services
	@echo "🐳 Stopping Docker services..."
	@docker compose down
	@echo "✅ Docker services stopped"

docker-logs: ## View Docker logs
	@docker compose logs -f

docker-restart: docker-down docker-up ## Restart Docker services

collect: ## Start hybrid collector
	@echo "📡 Starting hybrid collector..."
	@npm run collect:hybrid

collect-base: ## Start Base chain collector
	@echo "📡 Starting Base collector..."
	@npm run collect:base

collect-solana: ## Start Solana chain collector
	@echo "📡 Starting Solana collector..."
	@npm run collect:solana

analyze: ## Run quality analysis on database
	@echo "🔬 Running quality analysis..."
	@npm run analyze:db

analyze-scan: ## Run quality analysis from x402scan
	@echo "🔬 Running quality analysis from x402scan..."
	@npm run analyze

verify: ## Verify project setup
	@echo "🔍 Verifying setup..."
	@npm run verify

db-push: ## Push database schema changes
	@echo "🗄️  Pushing database schema..."
	@npx prisma db push

db-studio: ## Open Prisma Studio (database GUI)
	@echo "🎨 Opening Prisma Studio..."
	@npx prisma studio

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "⚠️  This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@npx prisma db push --force-reset
	@echo "✅ Database reset complete"

logs: ## View application logs
	@tail -f logs/*.log 2>/dev/null || echo "No log files found"

# Development workflow commands
dev-reset: clean install setup ## Full development reset
	@echo "✅ Development environment reset complete!"

quick-check: lint typecheck ## Quick checks before commit
	@echo "✅ Quick checks passed!"

full-check: lint typecheck test ## Full checks before push
	@echo "✅ Full checks passed!"

# CI/CD simulation
ci: install lint typecheck test ## Simulate CI pipeline
	@echo "✅ CI pipeline passed!"

# Information
info: ## Show project information
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "x402 Protocol Observatory"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "Node.js:    $$(node -v 2>/dev/null || echo 'not found')"
	@echo "npm:        $$(npm -v 2>/dev/null || echo 'not found')"
	@echo "TypeScript: $$(npx tsc -v 2>/dev/null || echo 'not found')"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "Run 'make help' for available commands"
	@echo ""

version: ## Show versions of all tools
	@echo "Versions:"
	@echo "  Node.js:    $$(node -v)"
	@echo "  npm:        $$(npm -v)"
	@echo "  TypeScript: $$(npx tsc -v)"
	@echo "  Next.js:    $$(npm list next --depth=0 | grep next | cut -d@ -f2)"
