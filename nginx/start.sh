#!/bin/sh
set -e

# 业务数据(SQLite)与产业检索飞轮都放在 /app/data,部署时把该目录挂成持久卷
export DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR"
export DATABASE_URL="${DATABASE_URL:-file:$DATA_DIR/app.db}"
export INDUSTRY_DATA_DIR="${INDUSTRY_DATA_DIR:-$DATA_DIR/industry-flywheel}"

echo "[start] 启动 nginx..."
nginx

echo "[start] 启动 Next.js (port 3001)..."
exec env PORT=3001 npx next start
