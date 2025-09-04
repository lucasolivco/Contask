# backend/Dockerfile
FROM node:20-alpine

# ✅ INSTALAR CURL PARA HEALTHCHECK
RUN apk add --no-cache curl

# ✅ CRIAR USUÁRIO NÃO-ROOT
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

WORKDIR /app

# ✅ COPIAR PACKAGE FILES
COPY package*.json ./
COPY prisma ./prisma/

# ✅ INSTALAR DEPENDÊNCIAS
RUN npm ci

# ✅ GERAR PRISMA CLIENT
RUN npx prisma generate

# ✅ COPIAR CÓDIGO
COPY . .

# ✅ ALTERAR OWNERSHIP
RUN chown -R backend:nodejs /app

# ✅ CRIAR DIRETÓRIOS
RUN mkdir -p /app/uploads /app/logs
RUN chown -R backend:nodejs /app/uploads /app/logs

# ✅ USAR USUÁRIO NÃO-ROOT
USER backend

EXPOSE 3001

# ✅ HEALTHCHECK
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "run", "dev"]