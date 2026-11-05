# Etapa 1: Build de la aplicacion React con Vite
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx de produccion
FROM nginx:alpine

# Copiar configuracion optimizada y endurecida de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estaticos generados en la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
