#!/bin/sh
set -e

cd /var/www/html

echo "📦 Verificando dependências do Laravel..."
if [ ! -d "vendor" ] || [ ! -f "vendor/autoload.php" ]; then
    echo "🔧 Instalando dependências do Composer..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env 2>/dev/null || true
fi

# Gerar APP_KEY se não existir
if [ -f ".env" ]; then
    if ! grep -q "^APP_KEY=base64:" .env || grep -q "^APP_KEY=$" .env; then
        echo "🔑 Gerando APP_KEY..."
        php artisan key:generate --force 2>/dev/null || true
    fi
fi

# Configurar permissões do storage
echo "📁 Configurando permissões..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R nobody:nobody storage bootstrap/cache 2>/dev/null || true

# Rodar migrations se necessário
echo "🗄️ Verificando migrações..."
php artisan migrate --force 2>/dev/null || echo "⚠️ Migrações não executadas (pode estar aguardando banco)"

# Limpar caches
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

echo "🚀 Iniciando servidor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
