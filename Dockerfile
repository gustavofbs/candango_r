FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar package files
COPY package.json pnpm-lock.yaml* ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build da aplicação
RUN pnpm run build

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["pnpm", "start"]
