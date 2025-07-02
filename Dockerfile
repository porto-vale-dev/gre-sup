# Estágio 1: Dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Estágio 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Estágio 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# A variável HOSTNAME garante que o app escute em todas as interfaces de rede
ENV HOSTNAME="0.0.0.0"
# O Next.js usará a porta definida pelo Cloud Run (via ENV PORT), que é 8080 por padrão

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos da build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# O Next.js já usa a variável de ambiente PORT que o Cloud Run define.
CMD ["node", "server.js"]
