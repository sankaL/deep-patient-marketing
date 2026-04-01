.PHONY: build check-env dev down logs ps

COMPOSE := docker compose

build:
	$(COMPOSE) build

check-env:
	@test -f backend/.env || (echo "Missing backend/.env. Copy backend/.env.example to backend/.env and add your Tavus credentials before running make dev." && exit 1)

dev: check-env
	$(COMPOSE) up --build

down:
	$(COMPOSE) down --remove-orphans

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps