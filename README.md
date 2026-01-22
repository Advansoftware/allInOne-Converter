# 🎬 AllInOne Converter

Sistema de conversão de mídia com arquitetura de microserviços, suporte a torrents, downloads de URLs e streaming HLS.

![Docker](https://img.shields.io/badge/Docker-20.10+-blue?style=flat-square&logo=docker)
![Laravel](https://img.shields.io/badge/Laravel-10-red?style=flat-square&logo=laravel)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-yellow?style=flat-square&logo=python)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Serviços](#-serviços)
- [API](#-api)
- [Comandos Make](#-comandos-make)
- [Desenvolvimento](#-desenvolvimento)

## 🎯 Visão Geral

O AllInOne Converter é uma plataforma completa para:

- 🎥 **Conversão de vídeos** - Converta entre diversos formatos (MP4, WebM, AVI, MKV, etc.)
- 📥 **Download de URLs** - Baixe vídeos do YouTube, Vimeo e outros 1000+ sites
- 🧲 **Download de Torrents** - Baixe via magnet links ou arquivos .torrent
- 📺 **Streaming HLS** - Preview de arquivos em tempo real
- ⏳ **Fila assíncrona** - Processamento em background com status em tempo real

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                           │
│                         http://localhost:3000                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Laravel)                         │
│                         http://localhost:8080                        │
│                     Nginx + PHP-FPM + Supervisor                     │
└───────┬───────────────┬───────────────┬───────────────┬─────────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   CONVERTER   │ │  DOWNLOADER   │ │    TORRENT    │ │   STREAMER    │
│   (Python)    │ │   (Python)    │ │   (Python)    │ │   (Python)    │
│   FFmpeg      │ │    yt-dlp     │ │  libtorrent   │ │     HLS       │
│  :8001        │ │    :8002      │ │    :8003      │ │    :8004      │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │               │               │               │
        └───────────────┴───────────────┴───────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │      REDIS      │         │     MYSQL       │
          │    (Queue)      │         │   (Database)    │
          │     :6379       │         │     :3306       │
          └─────────────────┘         └─────────────────┘
```

### Volumes Compartilhados

```
shared-storage/    → Arquivos processados entre serviços
torrent-data/      → Downloads de torrent
stream-cache/      → Cache de streaming HLS
redis-data/        → Persistência do Redis
mysql-data/        → Dados do MySQL
```

## 📋 Requisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Make** (opcional, mas recomendado)
- **8GB RAM** mínimo recomendado
- **20GB** espaço em disco

## 🚀 Instalação

### Clone o repositório

```bash
git clone https://github.com/seu-usuario/allInOne-Converter.git
cd allInOne-Converter
```

### Inicie o projeto

```bash
# Com Make (recomendado)
make up

# Ou com docker-compose
docker-compose up -d
```

**Pronto!** Sem configurações adicionais necessárias. 🎉

### URLs disponíveis

| Serviço    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:3000 |
| API        | http://localhost:8080 |
| Converter  | http://localhost:8001 |
| Downloader | http://localhost:8002 |
| Torrent    | http://localhost:8003 |
| Streamer   | http://localhost:8004 |

## 📖 Uso

### Upload de Arquivo

1. Acesse http://localhost:3000
2. Clique em "Adicionar Arquivo"
3. Arraste um arquivo de vídeo/áudio ou clique para selecionar
4. Escolha o perfil de conversão
5. Acompanhe o progresso na fila

### Download de URL

1. Acesse http://localhost:3000
2. Cole a URL do vídeo (YouTube, Vimeo, etc.)
3. O sistema detecta automaticamente o tipo
4. O download inicia automaticamente

### Torrent

1. Acesse http://localhost:3000
2. Cole um magnet link ou selecione um arquivo .torrent
3. Selecione os arquivos desejados
4. Acompanhe o progresso com estatísticas de peers/seeds

### Preview HLS

- Durante conversões, clique em "Preview" para assistir em tempo real
- Para torrents, aguarde o download começar e clique em "Preview"

## 🔧 Serviços

### 🎬 Converter (Python + FFmpeg)

Responsável pela conversão de arquivos de mídia.

**Recursos:**
- Múltiplos perfis de conversão pré-configurados
- Geração de thumbnails automática
- Geração de HLS para streaming
- Suporte a hardware acceleration (quando disponível)

**Endpoints principais:**
- `POST /upload` - Upload e conversão
- `POST /convert` - Converter arquivo existente
- `GET /status/{job_id}` - Status do job
- `GET /profiles` - Perfis disponíveis

### 📥 Downloader (Python + yt-dlp)

Download de vídeos de 1000+ sites.

**Sites suportados:**
- YouTube, Vimeo, Dailymotion
- Twitter/X, Instagram, TikTok
- E muitos outros...

**Endpoints principais:**
- `POST /download` - Iniciar download
- `GET /status/{job_id}` - Status
- `GET /info` - Informações do vídeo

### 🧲 Torrent (Python + libtorrent)

Download de arquivos via BitTorrent.

**Recursos:**
- Suporte a magnet links
- Upload de arquivos .torrent
- Seleção de arquivos específicos
- Pause/Resume individual
- Estatísticas em tempo real

**Endpoints principais:**
- `POST /add/magnet` - Adicionar magnet link
- `POST /add/file` - Upload de .torrent
- `POST /parse` - Analisar torrent
- `POST /select-files` - Selecionar arquivos
- `POST /pause/{job_id}` - Pausar
- `POST /resume/{job_id}` - Retomar

### 📺 Streamer (Python + HLS)

Streaming de vídeo em tempo real.

**Recursos:**
- Transcodificação on-demand
- Múltiplas qualidades (360p-1080p)
- Cache inteligente
- Suporte a arquivos em progresso

**Endpoints principais:**
- `POST /stream/prepare` - Preparar stream
- `GET /{stream_id}/playlist.m3u8` - Playlist HLS
- `GET /{stream_id}/{segment}` - Segmentos
- `POST /preview` - Preview rápido

## 📡 API

### Autenticação

A API usa Laravel Sanctum. Para endpoints protegidos:

```bash
curl -H "Authorization: Bearer {token}" http://localhost:8080/api/...
```

### Exemplos

#### Iniciar conversão

```bash
curl -X POST http://localhost:8080/api/conversion/upload \
  -F "file=@video.mp4" \
  -F "profile=youtube_hd"
```

#### Download de URL

```bash
curl -X POST http://localhost:8080/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=..."}'
```

#### Adicionar Magnet

```bash
curl -X POST http://localhost:8080/api/torrent/magnet \
  -H "Content-Type: application/json" \
  -d '{"magnet_url": "magnet:?xt=urn:btih:..."}'
```

#### Status da fila

```bash
curl http://localhost:8080/api/queue
```

## 🛠️ Comandos Make

```bash
# Principais
make up              # Inicia todos os containers
make down            # Para todos os containers
make build           # Builda as imagens
make rebuild         # Rebuild forçado (sem cache)
make logs            # Mostra logs de todos os containers

# Logs específicos
make logs-api        # Logs do API Gateway
make logs-converter  # Logs do Converter
make logs-torrent    # Logs do Torrent
make logs-frontend   # Logs do Frontend

# Database
make migrate         # Executa migrations
make seed            # Executa seeders
make db-fresh        # Recria banco (fresh + seed)

# Shell
make shell-api       # Acessa shell do API
make shell-db        # Acessa MySQL CLI
make redis-cli       # Acessa Redis CLI

# Status
make status          # Status dos containers
make health          # Verifica saúde dos serviços

# Limpeza
make clean           # Para e remove volumes
make prune           # Limpa recursos não usados
```

## 💻 Desenvolvimento

### Estrutura do projeto

```
allInOne-Converter/
├── docker-compose.yml     # Orquestração Docker
├── Makefile              # Comandos de automação
├── services/             # Microserviços
│   ├── api/              # Configurações do API Gateway
│   ├── converter/        # Serviço de conversão (Python)
│   ├── downloader/       # Serviço de download (Python)
│   ├── torrent/          # Serviço de torrent (Python)
│   ├── streamer/         # Serviço de streaming (Python)
│   ├── frontend/         # Configurações do frontend
│   └── database/         # Scripts de inicialização
├── Project/
│   ├── api/              # Laravel API
│   └── web/              # React Frontend
└── README.md
```

### Hot Reload

O desenvolvimento tem hot reload habilitado:

- **Frontend**: Modificações em `Project/web/src` são refletidas automaticamente
- **API**: Código PHP é montado diretamente no container
- **Microserviços Python**: Reinicie o container específico para aplicar mudanças

### Adicionando novos perfis de conversão

Edite `Project/web/src/conversionProfiles.json`:

```json
{
  "id": "meu_perfil",
  "name": "Meu Perfil",
  "description": "Descrição do perfil",
  "format": "mp4",
  "videoCodec": "libx264",
  "audioCodec": "aac",
  "videoBitrate": "5M",
  "audioBitrate": "192k"
}
```

### Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Suporte

- 📫 Issues: [GitHub Issues](https://github.com/seu-usuario/allInOne-Converter/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/seu-usuario/allInOne-Converter/discussions)

---

Desenvolvido com ❤️ usando Docker, Laravel, React e Python
