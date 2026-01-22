#!/bin/sh
set -e

cd /var/www/html

echo "📦 Aguardando dependências do Laravel..."
# Aguarda até o vendor existir (instalado pelo container api)
max_attempts=60
attempt=0
while [ ! -f "vendor/autoload.php" ]; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Timeout aguardando vendor/autoload.php"
        exit 1
    fi
    echo "⏳ Aguardando composer install... ($attempt/$max_attempts)"
    sleep 2
done

echo "✅ Dependências encontradas!"
echo "🚀 Iniciando queue worker..."
exec "$@"
