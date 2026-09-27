# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Configurar la URL del backend para producción si es necesario
# ENV VITE_API_URL=http://backend:3000/api
RUN npm run build

# Etapa 2: Serve
FROM nginx:alpine
# Copiar los archivos estáticos construidos por Vite al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración por defecto para Single Page Applications (React Router)
RUN echo 'server { \
    listen 80; \
    server_name projectsunach.dev www.projectsunach.dev; \
    return 301 https://$host$request_uri; \
} \
server { \
    listen 443 ssl; \
    server_name projectsunach.dev www.projectsunach.dev; \
    ssl_certificate /etc/letsencrypt/live/projectsunach.dev/fullchain.pem; \
    ssl_certificate_key /etc/letsencrypt/live/projectsunach.dev/privkey.pem; \
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always; \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;" always; \
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
