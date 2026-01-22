#!/bin/sh
set -e

echo "📦 Instalando dependências do frontend..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    npm install
fi

echo "🚀 Iniciando servidor de desenvolvimento Vite..."
exec npm run dev
