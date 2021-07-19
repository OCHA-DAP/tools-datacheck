FROM unocha/nodejs-builder:12 AS builder

WORKDIR /src

COPY . .

RUN npm install npm@latest -g && \
    npm install -g @angular/cli && \
    npm install && \
    ng build --prod --base-href /wizard/datacheck/

FROM unocha/nginx:1.20

COPY ./docker/common.conf ./docker/default.conf /etc/nginx/http.d/
COPY --from=builder /src/dist /var/www

VOLUME /var/log/nginx

# Volumes
# - Conf: /etc/nginx/conf.d (default.conf)
# - Cache: /var/cache/nginx
# - Logs: /var/log/nginx
# - Data: /var/www
