#!/bin/sh
set -e

echo "[start] 启动 nginx..."
nginx

echo "[start] 启动 Next.js (port 3001)..."
exec env PORT=3001 npx next start
