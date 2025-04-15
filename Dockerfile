FROM node:18

WORKDIR /app

RUN npm install -g pnpm@9.14.2

COPY . .

RUN pnpm install
RUN pnpm build

EXPOSE 3000

# Запускаем продовый скрипт
CMD ["pnpm", "run", "prod"]
