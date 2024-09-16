# Baseado em Node.js
FROM node:20-slim

# Instalar as dependências do sistema
RUN apt-get update && apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libxdamage1 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libxcomposite1 \
  libxshmfence1 \
  libglu1-mesa

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos do projeto
COPY . .

# Instalar as dependências do Node.js
RUN npm install

# Gerar o build
RUN npm run build

# Comando para iniciar o servidor
CMD ["npm", "start"]
