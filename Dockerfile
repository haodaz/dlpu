# 生产镜像：Next.js 16 (App Router) + nginx 反向代理（gzip / SSE）
# alpha 与 prod 共用本文件：当前项目没有按环境区分的构建期变量（NEXT_PUBLIC_* 未被实际引用）。
# 若后续出现环境相关的构建期变量，再拆成 Dockerfile.alpha / Dockerfile.prod。

FROM ma.applysquare.net:4567/eng/flora/node:22.22-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# openssl：Prisma generate 依赖它探测 libssl 版本，缺失会退化为 openssl-1.1.x 引擎
RUN apk add --no-cache openssl

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && \
  npm config set fetch-retries 5 && \
  npm config set fetch-retry-mintimeout 10000 && \
  npm config set fetch-retry-maxtimeout 60000 && \
  npm config set fetch-timeout 120000 && \
  npm ci --ignore-engines --ignore-scripts || \
  (npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm ci --ignore-engines --ignore-scripts)

# 禁用 Next.js 遥测，防止 build 时向外部网络发请求超时
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

# --ignore-scripts 跳过了 postinstall 的 prisma generate，必须显式生成，
# 否则 @prisma/client 只是空壳，构建/运行都会报 "Prisma Client not generated"。
# 引擎下载优先走 npmmirror 镜像，失败再回退官方源。
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN npx prisma generate || (unset PRISMA_ENGINES_MIRROR && npx prisma generate)

RUN npm run build

FROM ma.applysquare.net:4567/eng/flora/node:22.22-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# openssl：Prisma 的 musl 引擎依赖 libssl
RUN apk add --no-cache curl nginx openssl

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && \
  npm ci --omit=dev --ignore-scripts || \
  (npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm ci --omit=dev --ignore-scripts)

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# MCP 二进制：src/lib/mcp/utils.ts 按 process.cwd()/src/lib/mcp/bin 查找
COPY --from=builder /app/src/lib/mcp/bin ./src/lib/mcp/bin

# Prisma Client 生成产物：@prisma/client 位于 devDependencies，
# --omit=dev 不会安装它，因此从 builder 拷贝生成结果（含查询引擎）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Nginx 配置
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf
COPY nginx/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

ENV NODE_ENV=production

CMD ["/start.sh"]
