FROM unocha/nodejs-builder:8.11.3 AS builder

WORKDIR /src

COPY . .

RUN npm install -g @angular/cli && \
    npm install && \
    ng build --prod -bh /wizard/datacheck/

FROM unocha/nginx:1.14

COPY ./docker/default.conf /etc/nginx/conf.d/
COPY --from=builder /src/dist /var/www

VOLUME /var/log/nginx

# Volumes
# - Conf: /etc/nginx/conf.d (default.conf)
# - Cache: /var/cache/nginx
# - Logs: /var/log/nginx
# - Data: /var/www
