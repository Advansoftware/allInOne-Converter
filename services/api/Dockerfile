FROM alpine:3.18

LABEL Maintainer="AllOne Converter"

# Install PHP 8.2 and required extensions
RUN apk add --no-cache \
  php82 \
  php82-fpm \
  php82-pdo \
  php82-pdo_mysql \
  php82-mbstring \
  php82-json \
  php82-xml \
  php82-openssl \
  php82-curl \
  php82-zip \
  php82-phar \
  php82-iconv \
  php82-dom \
  php82-simplexml \
  php82-xmlwriter \
  php82-tokenizer \
  php82-session \
  php82-fileinfo \
  php82-ctype \
  php82-bcmath \
  php82-redis \
  php82-pcntl \
  php82-posix \
  nginx \
  supervisor \
  curl \
  git

# Create symlink for php
RUN ln -sf /usr/bin/php82 /usr/bin/php

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin --filename=composer

# Configure Nginx
COPY config/nginx.conf /etc/nginx/nginx.conf

# Configure PHP-FPM
COPY config/php-fpm.conf /etc/php82/php-fpm.d/www.conf
COPY config/php.ini /etc/php82/conf.d/custom.ini

# Configure Supervisor
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create required directories
RUN mkdir -p /var/www/html \
  && mkdir -p /run/nginx \
  && mkdir -p /var/log/supervisor

# Set permissions
RUN chown -R nobody:nobody /var/www/html /run/nginx /var/log/nginx

WORKDIR /var/www/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY queue-entrypoint.sh /queue-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh /queue-entrypoint.sh

# Expose port
EXPOSE 8080

# Entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Healthcheck
HEALTHCHECK --timeout=10s CMD curl --silent --fail http://127.0.0.1:8080/api/health || exit 1
