FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Vite precisa que a porta seja exposta desta forma para funcionar bem com Docker
EXPOSE 5173

CMD ["npm", "run", "dev"]