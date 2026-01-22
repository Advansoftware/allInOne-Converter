# AllInOne Converter - Makefile
# Sistema de build e gerenciamento Docker

.PHONY: help up down build rebuild logs clean status shell \
        logs-api logs-converter logs-downloader logs-torrent logs-streamer logs-frontend \
        migrate seed db-fresh test install

# Cores para output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
BLUE   := \033[0;34m
NC     := \033[0m # No Color

# Docker compose command
DOCKER_COMPOSE := docker-compose

# Default target
.DEFAULT_GOAL := help

##@ Comandos Principais

help: ## Mostra esta ajuda
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║           AllInOne Converter - Sistema de Build              ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "$(YELLOW)Uso:$(NC)\n  make $(BLUE)<comando>$(NC)\n\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

up: ## 🚀 Inicia todos os containers (modo detached)
	@echo "$(GREEN)🚀 Iniciando AllInOne Converter...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(GREEN)✅ Sistema iniciado com sucesso!$(NC)"
	@echo ""
	@echo "$(YELLOW)📍 URLs disponíveis:$(NC)"
	@echo "   $(BLUE)Frontend:$(NC)   http://localhost:3000"
	@echo "   $(BLUE)API:$(NC)        http://localhost:8080"
	@echo "   $(BLUE)Converter:$(NC)  http://localhost:8001"
	@echo "   $(BLUE)Downloader:$(NC) http://localhost:8002"
	@echo "   $(BLUE)Torrent:$(NC)    http://localhost:8003"
	@echo "   $(BLUE)Streamer:$(NC)   http://localhost:8004"
	@echo ""

up-logs: ## 🚀 Inicia e mostra logs em tempo real
	@echo "$(GREEN)🚀 Iniciando AllInOne Converter com logs...$(NC)"
	@$(DOCKER_COMPOSE) up

down: ## 🛑 Para todos os containers
	@echo "$(RED)🛑 Parando containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Containers parados$(NC)"

stop: ## ⏸️  Para os containers sem remover
	@$(DOCKER_COMPOSE) stop

start: ## ▶️  Inicia containers parados
	@$(DOCKER_COMPOSE) start

restart: ## 🔄 Reinicia todos os containers
	@echo "$(YELLOW)🔄 Reiniciando containers...$(NC)"
	@$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✅ Containers reiniciados$(NC)"

##@ Build

build: ## 🔨 Builda todas as imagens
	@echo "$(YELLOW)🔨 Buildando imagens...$(NC)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✅ Build completo$(NC)"

rebuild: ## 🔨 Rebuild forçado (sem cache)
	@echo "$(YELLOW)🔨 Rebuild forçado (sem cache)...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✅ Rebuild completo$(NC)"

build-up: ## 🔨🚀 Builda e inicia os containers
	@echo "$(YELLOW)🔨 Buildando e iniciando...$(NC)"
	@$(DOCKER_COMPOSE) up -d --build
	@echo "$(GREEN)✅ Build e inicialização completos$(NC)"

##@ Logs

logs: ## 📋 Mostra logs de todos os containers
	@$(DOCKER_COMPOSE) logs -f

logs-api: ## 📋 Logs do serviço API
	@$(DOCKER_COMPOSE) logs -f api

logs-converter: ## 📋 Logs do serviço Converter
	@$(DOCKER_COMPOSE) logs -f converter

logs-downloader: ## 📋 Logs do serviço Downloader
	@$(DOCKER_COMPOSE) logs -f downloader

logs-torrent: ## 📋 Logs do serviço Torrent
	@$(DOCKER_COMPOSE) logs -f torrent

logs-streamer: ## 📋 Logs do serviço Streamer
	@$(DOCKER_COMPOSE) logs -f streamer

logs-frontend: ## 📋 Logs do serviço Frontend
	@$(DOCKER_COMPOSE) logs -f frontend

logs-redis: ## 📋 Logs do Redis
	@$(DOCKER_COMPOSE) logs -f redis

logs-db: ## 📋 Logs do banco de dados
	@$(DOCKER_COMPOSE) logs -f database

##@ Database

migrate: ## 🗃️  Executa migrations do Laravel
	@echo "$(YELLOW)🗃️  Executando migrations...$(NC)"
	@$(DOCKER_COMPOSE) exec api php artisan migrate
	@echo "$(GREEN)✅ Migrations executadas$(NC)"

seed: ## 🌱 Executa seeders do Laravel
	@echo "$(YELLOW)🌱 Executando seeders...$(NC)"
	@$(DOCKER_COMPOSE) exec api php artisan db:seed
	@echo "$(GREEN)✅ Seeders executados$(NC)"

db-fresh: ## 🔄 Recria o banco (fresh + seed)
	@echo "$(RED)⚠️  Recriando banco de dados...$(NC)"
	@$(DOCKER_COMPOSE) exec api php artisan migrate:fresh --seed
	@echo "$(GREEN)✅ Banco recriado$(NC)"

##@ Shell / Acesso

shell-api: ## 🐚 Acessa shell do container API
	@$(DOCKER_COMPOSE) exec api sh

shell-converter: ## 🐚 Acessa shell do Converter
	@$(DOCKER_COMPOSE) exec converter sh

shell-frontend: ## 🐚 Acessa shell do Frontend
	@$(DOCKER_COMPOSE) exec frontend sh

shell-db: ## 🐚 Acessa MySQL CLI
	@$(DOCKER_COMPOSE) exec database mysql -u laravel -plaravel_pass laravel

redis-cli: ## 🔴 Acessa Redis CLI
	@$(DOCKER_COMPOSE) exec redis redis-cli

##@ Status & Info

status: ## 📊 Mostra status dos containers
	@echo "$(BLUE)📊 Status dos containers:$(NC)"
	@$(DOCKER_COMPOSE) ps

ps: status ## Alias para status

health: ## 💚 Verifica saúde dos serviços
	@echo "$(BLUE)💚 Verificando saúde dos serviços...$(NC)"
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@$(DOCKER_COMPOSE) exec redis redis-cli ping 2>/dev/null && echo "  ✅ OK" || echo "  ❌ FALHOU"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@$(DOCKER_COMPOSE) exec database mysqladmin ping -h localhost -u root --silent 2>/dev/null && echo "  ✅ OK" || echo "  ❌ FALHOU"
	@echo ""
	@echo "$(YELLOW)API:$(NC)"
	@curl -s http://localhost:8080/api/health > /dev/null 2>&1 && echo "  ✅ OK" || echo "  ❌ FALHOU"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -s http://localhost:3000 > /dev/null 2>&1 && echo "  ✅ OK" || echo "  ❌ FALHOU"
	@echo ""

##@ Testes

test: ## 🧪 Executa testes do Laravel
	@echo "$(YELLOW)🧪 Executando testes...$(NC)"
	@$(DOCKER_COMPOSE) exec api php artisan test
	@echo "$(GREEN)✅ Testes finalizados$(NC)"

test-coverage: ## 🧪 Testes com coverage
	@$(DOCKER_COMPOSE) exec api php artisan test --coverage

##@ Instalação / Setup

install: ## 📦 Instala dependências (composer + npm)
	@echo "$(YELLOW)📦 Instalando dependências...$(NC)"
	@$(DOCKER_COMPOSE) exec api composer install
	@$(DOCKER_COMPOSE) exec frontend npm install
	@echo "$(GREEN)✅ Dependências instaladas$(NC)"

composer-install: ## 📦 Instala dependências PHP
	@$(DOCKER_COMPOSE) exec api composer install

npm-install: ## 📦 Instala dependências Node
	@$(DOCKER_COMPOSE) exec frontend npm install

key-generate: ## 🔑 Gera chave da aplicação Laravel
	@$(DOCKER_COMPOSE) exec api php artisan key:generate

cache-clear: ## 🧹 Limpa cache do Laravel
	@$(DOCKER_COMPOSE) exec api php artisan cache:clear
	@$(DOCKER_COMPOSE) exec api php artisan config:clear
	@$(DOCKER_COMPOSE) exec api php artisan route:clear
	@$(DOCKER_COMPOSE) exec api php artisan view:clear
	@echo "$(GREEN)✅ Cache limpo$(NC)"

##@ Limpeza

clean: ## 🧹 Para containers e remove volumes
	@echo "$(RED)🧹 Limpando ambiente...$(NC)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)✅ Ambiente limpo$(NC)"

clean-images: ## 🧹 Remove imagens do projeto
	@echo "$(RED)🧹 Removendo imagens...$(NC)"
	@$(DOCKER_COMPOSE) down --rmi local
	@echo "$(GREEN)✅ Imagens removidas$(NC)"

prune: ## 🧹 Limpa recursos Docker não utilizados
	@echo "$(RED)🧹 Limpando recursos não utilizados...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✅ Sistema limpo$(NC)"

##@ Produção

prod-build: ## 🏭 Build para produção
	@echo "$(YELLOW)🏭 Build para produção...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ Build de produção completo$(NC)"

prod-up: ## 🏭 Inicia em modo produção
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d
