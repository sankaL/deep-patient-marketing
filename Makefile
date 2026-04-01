.PHONY: build check-env dev dev-local down logs ps stop

COMPOSE := docker compose

build:
	$(COMPOSE) build

check-env:
	@test -f backend/.env || (echo "Missing backend/.env. Copy backend/.env.example to backend/.env and add your Tavus credentials before running make dev." && exit 1)

# Docker-based development (default)
dev: check-env stop
	$(COMPOSE) up --build

# Local development without Docker
dev-local: check-env
	@echo "Starting backend on port 8000..."
	@cd backend && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting frontend on port 5173..."
	@cd frontend && npm run dev -- --host 0.0.0.0 --port 5173

# Stop any running containers
stop:
	$(COMPOSE) down --remove-orphans 2>/dev/null || true

# Stop and remove all containers, volumes
down:
	$(COMPOSE) down --remove-orphans -v

# View logs
logs:
	$(COMPOSE) logs -f

# View running containers
ps:
	$(COMPOSE) ps