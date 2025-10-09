# Usa a imagem 'slim' que já validamos ser compatível
FROM node:20-slim

WORKDIR /app

# Copia apenas os arquivos de dependência para aproveitar o cache
COPY package*.json ./

# Instala as dependências
RUN npm install

# O código-fonte será montado via volume no docker-compose
# Expõe a porta do backend
EXPOSE 3001

# Comando para iniciar o servidor em modo de desenvolvimento (com hot-reload)
CMD ["npm", "run", "dev"]