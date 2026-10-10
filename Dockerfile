# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Serve
FROM nginx:alpine
# Copiar los archivos estaticos
COPY --from=build /app/dist /usr/share/nginx/html

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server_tokens off;

# 1. Bloqueo de peticiones por IP directa (Zero Trust)
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate /etc/letsencrypt/live/projectsunach.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projectsunach.dev/privkey.pem;
    return 444;
}

# 2. Redireccion HTTP -> HTTPS
server {
    listen 80;
    server_name projectsunach.dev www.projectsunach.dev;
    return 301 https://www.projectsunach.dev;
}

# 3. Redireccion HTTPS sin www -> HTTPS con www
server {
    listen 443 ssl;
    server_name projectsunach.dev;
    ssl_certificate /etc/letsencrypt/live/projectsunach.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projectsunach.dev/privkey.pem;
    return 301 https://www.projectsunach.dev;
}

# 4. Aplicacion principal (HTTPS + Security Headers + VPC Peering)
server {
    listen 443 ssl;
    server_name www.projectsunach.dev;
    ssl_certificate /etc/letsencrypt/live/projectsunach.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projectsunach.dev/privkey.pem;
    
    # Security Headers para A+ en Mozilla Observatory
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://10.10.32.5:3000;" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        # Conexion secreta VPC Peering al Backend
        proxy_pass http://10.10.32.5:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
