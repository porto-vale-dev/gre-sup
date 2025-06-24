# 1. Base Stage: Instala as dependências
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Build Stage: Compila a aplicação Next.js
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
# As variáveis de ambiente públicas são necessárias durante o build
# Certifique-se de passá-las para o seu processo de build no Cloud Run
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
RUN npm run build

# 3. Production Stage: Executa a aplicação
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Copia os artefatos da build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# As variáveis de ambiente também são necessárias em tempo de execução
# O Cloud Run irá injetá-las no contêiner
# ENV NEXT_PUBLIC_SUPABASE_URL ...
# ENV NEXT_PUBLIC_SUPABASE_ANON_KEY ...

# A porta padrão para o Cloud Run é 8080
ENV PORT 8080

CMD ["node", "server.js"]
