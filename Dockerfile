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
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
