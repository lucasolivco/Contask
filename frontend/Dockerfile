# Use a imagem base do Node.js, pois vamos rodar o servidor de desenvolvimento Vite
FROM node:20-alpine

# ✅ INSTALAR CURL PARA HEALTHCHECK
RUN apk add --no-cache curl

# Crie um usuário não-root para a aplicação
RUN addgroup -S frontend && adduser -S frontend -G frontend

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos de dependência primeiro para otimizar o cache
COPY package*.json ./

# Instale TODAS as dependências
RUN npm ci

# AGORA, COPIE TODO O CÓDIGO-FONTE PARA DENTRO DA IMAGEM
COPY . .

# Mude o proprietário de todos os arquivos para o usuário não-root
RUN chown -R frontend:frontend /app

# Mude para o usuário não-root
USER frontend

# Exponha a porta do servidor de desenvolvimento Vite
EXPOSE 5173

# O comando padrão para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]