.PHONY: up


build-and-up-app:
	docker-compose -f docker-compose.yml up --build

up-app:
	docker-compose -f docker-compose.yml up

.PHONY: down

down-app:
	docker-compose -f docker-compose.yml down

stop-app:
	docker-compose -f docker-compose.yml stop

.PHONY: logs

logs:
	docker-compose logs -f
