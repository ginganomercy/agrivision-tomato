# ==============================================================================
# Multi-Stage Production Dockerfile for AgriVision Web Frontend (React + Three.js)
# Menggunakan Bun versi stabil terbaru (Tier-1 Linux glibc) sebagai Builder
# ==============================================================================

# STAGE 1: Build Assets with Bun (Latest Stable 1.x)
FROM oven/bun:1 AS builder
WORKDIR /app

# Salin package.json
COPY package.json ./

# Install dependensi menggunakan Bun secara murni di lingkungan Linux
RUN bun install

# Salin seluruh source code (node_modules host dikecualikan via .dockerignore)
COPY . .

# Jalankan production build (TypeScript strict check + Vite 8 minify)
RUN bun run build

# STAGE 2: Lightweight Production Runtime via Nginx Alpine (~25 MB)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Bersihkan konfigurasi bawaan Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Salin konfigurasi custom Nginx SPA (HTML5 routing, gzip, cache control)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin artefak hasil build dari builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
