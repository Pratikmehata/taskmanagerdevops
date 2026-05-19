.PHONY: help up down build logs shell-backend shell-mongo test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (detached)
	cp -n .env.example .env || true
	docker compose up -d --build

down: ## Stop all services
	docker compose down

build: ## Rebuild images
	docker compose build --no-cache

logs: ## Tail all service logs
	docker compose logs -f

logs-backend: ## Tail backend logs
	docker compose logs -f backend

logs-notify: ## Tail notification service logs
	docker compose logs -f notification-service

shell-backend: ## Open a shell in the backend container
	docker compose exec backend sh

shell-mongo: ## Open mongosh in the mongo container
	docker compose exec mongo mongosh -u $$MONGO_ROOT_USER -p $$MONGO_ROOT_PASS --authenticationDatabase admin taskmanager

test: ## Run backend tests (local, requires node_modules)
	cd backend && npm test

clean: ## Remove containers, volumes, and built images
	docker compose down -v --rmi local
