# Sitio estático Estrada Hermanos (HTML, CSS, JS con módulos ES).
# Nginx entrega los .js como application/javascript (imprescindible en el panel).

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY index.html acceso.html app.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY images/ /usr/share/nginx/html/images/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
