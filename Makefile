.PHONY: help up down logs build frontend backend bot infra clean migrate createsuperuser demo-data test fmt lint

help: ## Show this help message
	@echo "NeonCasino - Cyberpunk Gaming Platform"
	@echo "======================================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services with Docker Compose
	@echo "🚀 Starting NeonCasino services..."
	docker-compose up -d
	@echo "✅ Services started! Visit http://localhost:3000"

down: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped"

logs: ## View logs from all services
	docker-compose logs -f

build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build
	@echo "✅ Build complete"

frontend: ## Start frontend development server
	@echo "🎨 Starting frontend dev server..."
	cd frontend && npm run dev

backend: ## Start backend development server
	@echo "⚙️ Starting backend dev server..."
	cd backend && python manage.py runserver 0.0.0.0:8000

bot: ## Start Telegram bot
	@echo "🤖 Starting Telegram bot..."
	cd bot && python main.py

infra: ## Start infrastructure services only (DB, Redis, MinIO)
	@echo "🏗️ Starting infrastructure services..."
	docker-compose up -d postgres redis minio
	@echo "✅ Infrastructure services started"

clean: ## Clean up Docker containers and volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete"

migrate: ## Run database migrations
	@echo "🗄️ Running migrations..."
	docker-compose exec backend python manage.py migrate
	@echo "✅ Migrations complete"

createsuperuser: ## Create Django superuser
	@echo "👑 Creating superuser..."
	docker-compose exec backend python manage.py createsuperuser

demo-data: ## Generate demo data
	@echo "🎲 Generating demo data..."
	docker-compose exec backend python manage.py generate_demo_data
	@echo "✅ Demo data generated"

test: ## Run tests
	@echo "🧪 Running tests..."
	cd frontend && npm run test
	cd backend && python manage.py test
	@echo "✅ Tests complete"

fmt: ## Format code
	@echo "✨ Formatting code..."
	cd frontend && npm run format
	cd backend && black . && isort .
	@echo "✅ Code formatted"

lint: ## Run linters
	@echo "🔍 Running linters..."
	cd frontend && npm run lint
	cd backend && flake8 . && black --check . && isort --check-only .
	@echo "✅ Linting complete"

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd frontend && npm install
	cd backend && pip install -r requirements.txt
	@echo "✅ Dependencies installed"

setup: ## Initial project setup
	@echo "🚀 Setting up NeonCasino project..."
	@echo "1. Creating directories..."
	mkdir -p frontend backend bot infra
	@echo "2. Installing dependencies..."
	$(MAKE) install
	@echo "3. Setting up environment..."
	cp .env.example .env
	@echo "4. Starting infrastructure..."
	$(MAKE) infra
	@echo "5. Running migrations..."
	$(MAKE) migrate
	@echo "✅ Setup complete! Run 'make up' to start all services"

status: ## Show service status
	@echo "📊 Service Status:"
	docker-compose ps

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	$(MAKE) down
	$(MAKE) up

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-bot: ## View bot logs
	docker-compose logs -f bot

shell-backend: ## Open backend shell
	docker-compose exec backend python manage.py shell

shell-db: ## Open database shell
	docker-compose exec postgres psql -U neoncasino -d neoncasino

backup: ## Create database backup
	@echo "💾 Creating database backup..."
	docker-compose exec postgres pg_dump -U neoncasino neoncasino > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created"

restore: ## Restore database from backup
	@echo "📥 Restoring database from backup..."
	@read -p "Enter backup filename: " backup_file; \
	docker-compose exec -T postgres psql -U neoncasino -d neoncasino < $$backup_file
	@echo "✅ Database restored"

monitor: ## Monitor system resources
	@echo "📈 System Monitor:"
	docker stats --no-stream

health: ## Check service health
	@echo "🏥 Health Check:"
	@echo "Frontend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "DOWN")"
	@echo "Backend: $$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "DOWN")"
	@echo "Database: $$(docker-compose exec -T postgres pg_isready -U neoncasino > /dev/null 2>&1 && echo "UP" || echo "DOWN")"
	@echo "Redis: $$(docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo "UP" || echo "DOWN")"



















