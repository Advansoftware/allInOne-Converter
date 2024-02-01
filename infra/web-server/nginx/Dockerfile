ARG ALPINE_VERSION=3.17

FROM alpine:${ALPINE_VERSION}

LABEL Maintainer="tadeu.torres"

# Instala todos os pacotes necessários para a aplicação
RUN apk add --no-cache php81 \
    curl \
    nginx \
    php81-common \
    php81-fpm \
    php81-pdo \
    php81-opcache \
    php81-zip \
    php81-phar \
    php81-iconv \
    php81-cli \
    php81-curl \
    php81-openssl \
    php81-mbstring \
    php81-tokenizer \
    php81-fileinfo \
    php81-json \
    php81-xml \
    php81-xmlwriter \
    php81-simplexml \
    php81-dom \
    php81-pdo_mysql \
    php81-pdo_sqlite \
    php81-tokenizer \
    php81-pecl-redis \
    supervisor \
    git \
    doas

# Instala o composer via curl
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin --filename=composer

# Configura o nginx - http
COPY config/nginx.conf /etc/nginx/nginx.conf
# Configurações padrão do nginx
COPY config/conf.d /etc/nginx/conf.d/

# Configura o PHP-FPM
COPY config/fpm-pool.conf /etc/php81/php-fpm.d/www.conf
COPY config/php.ini /etc/php81/conf.d/custom.ini

# Configura o supervisord
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

#Cria um usuário novo com uma senha e o adiciona no grupo wheel. Por fim, configura o grupo wheel para ter privilégios de root
RUN adduser allone-converter -G wheel; \
    echo 'allone-converter:123' | chpasswd; \
    echo 'permit :wheel as root' > /etc/doas.d/doas.conf

# Faz com que o usuário allone-converter tenha acesso aos arquivos e pastas necessários
RUN chown -R allone-converter.wheel /var/www /run /var/lib/nginx /var/log/nginx

USER allone-converter

# Especifica o diretório padrão do conteiner
WORKDIR /var/www/html/api

# Supervisord inicia o nginx & php-fpm
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# Configura o healthcheck para validar se tudo está funcionando
HEALTHCHECK --timeout=10s CMD curl --silent --fail http://127.0.0.1:8080/fpm-ping