FROM public.ecr.aws/unocha/nodejs-builder:22-alpine AS builder

WORKDIR /src

COPY . .

RUN npm install npm@10.9.2 -g && \
  npm install -g @angular/cli@v19.1 && \
  npm install && \
  ng build --configuration production --base-href /tools/datacheck/

FROM public.ecr.aws/unocha/nginx:stable

COPY ./docker/default.conf /etc/nginx/http.d/
COPY --from=builder /src/dist/browser /var/www

VOLUME /var/log/nginx

# Volumes
# - Conf: /etc/nginx/conf.d (default.conf)
# - Cache: /var/cache/nginx
# - Logs: /var/log/nginx
# - Data: /var/www
