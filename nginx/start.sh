#!/bin/sh
set -e

echo "[start] 启动 nginx..."
mkdir -p /run/nginx
nginx

echo "[start] 执行 Prisma 数据库部署..."
PRISMA_TELEMETRY_DISABLED=1 npx --yes prisma db push --schema=./prisma/schema.prisma --accept-data-loss || true

echo "[start] 启动 Next.js (port 5860)..."
exec env PORT=5860 HOSTNAME=127.0.0.1 npx next start
