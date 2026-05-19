# frontend/Dockerfile
FROM nginx:1.27-alpine

# Nginx config: serve SPA and proxy /api → backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80
