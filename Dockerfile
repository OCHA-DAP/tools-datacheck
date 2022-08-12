FROM public.ecr.aws/unocha/nodejs-builder:12-alpine AS builder

WORKDIR /src

COPY . .

RUN npm install npm@latest -g && \
    npm install -g @angular/cli && \
    npm install && \
    ng build --prod --base-href /tools/datacheck/

FROM public.ecr.aws/unocha/nginx:stable

COPY ./docker/common.conf ./docker/default.conf /etc/nginx/http.d/
COPY --from=builder /src/dist /var/www

VOLUME /var/log/nginx

# Volumes
# - Conf: /etc/nginx/conf.d (default.conf)
# - Cache: /var/cache/nginx
# - Logs: /var/log/nginx
# - Data: /var/www
