APP_NAME = trancendence

BASE_COMPOSE = -f ./docker-compose.yml
DEV_COMPOSE = -f ./docker-compose.yml -f ./docker-compose.dev.yml
PROD_COMPOSE = -f ./docker-compose.yml -f ./docker-compose.prod.yml

DEV_DOCKER = docker compose $(DEV_COMPOSE) -p $(APP_NAME)_dev
PROD_DOCKER = docker compose $(PROD_COMPOSE) -p $(APP_NAME)_prod

all: start_dev makemigrations migrates

build:
	$(DEV_DOCKER) build

start_dev:
	touch backend/.allowed_hosts
	touch backend/.cors_origins_whitelist
	$(DEV_DOCKER) up -d --build

start_prod:
	$(PROD_DOCKER) up -d --build

ps:
	$(DEV_DOCKER) ps

floga:
	$(DEV_DOCKER) logs --tail=42 -ft

logsfront:
	$(DEV_DOCKER) logs front

logsback:
	$(DEV_DOCKER) logs back

logsnginx:
	$(DEV_DOCKER) logs nginx

restart:
	$(DEV_DOCKER) restart

restart_back:
	$(DEV_DOCKER) restart backend

restart_front:
	$(DEV_DOCKER) restart frontend

restart_nginx:
	$(DEV_DOCKER) restart nginx

stop:
	$(DEV_DOCKER) down

stop_prod:
	$(PROD_DOCKER) down

down:
	$(DEV_DOCKER) down

clean: down
	$(DEV_DOCKER) down --volumes

re: clean all

# Backend commands
# BACKEND_CONTAINER = trancendence_dev-backend-1

# migrate:
# 	docker exec -it $(BACKEND_CONTAINER) python manage.py migrate

# makemigrations:
# 	docker exec -it $(BACKEND_CONTAINER) python manage.py makemigrations

# todo remove for production
# superuser:
# 	docker exec -it $(BACKEND_CONTAINER) python manage.py createsuperuser --noinput
makemigrations:
	$(DEV_DOCKER) exec backend python manage.py makemigrations

migrates:
	$(DEV_DOCKER) exec backend python manage.py migrate


.PHONY: all build start_dev start_prod ps floga logsfront logsback logsnginx restart restart_back restart_front restart_nginx stop stop_prod down clean re makemigrations migrates


