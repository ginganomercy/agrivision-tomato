# ==============================================================================
# Multi-Stage Production Dockerfile for AgriVision Web Frontend (React + Three.js)
# ==============================================================================

# STAGE 1: Build Assets with Bun
FROM oven/bun:1.1.42-alpine AS builder
WORKDIR /app

# Salin dependencies manifest
COPY package.json ./

# Install dependencies dengan reproducible lockfile check
RUN bun install

# Salin source code
COPY . .

# Jalankan production build (TypeScript strict check + Vite 8 minify)
RUN bun run build

# STAGE 2: Lightweight Production Runtime via Nginx Alpine
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Bersihkan konfigurasi default Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Salin konfigurasi custom Nginx SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin artefak hasil build dari builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
