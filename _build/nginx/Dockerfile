FROM nginx

COPY _build/nginx/local.conf /etc/nginx/conf.d/default.conf
COPY _build/nginx/start.sh /
COPY _build/nginx/certs/transcendence.key /etc/nginx/certs/
COPY _build/nginx/certs/transcendence.crt /etc/nginx/certs/

RUN chmod +x /start.sh
CMD [ "sh", "/start.sh" ]