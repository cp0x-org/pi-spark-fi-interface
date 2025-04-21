FROM node:18 AS builder

RUN npm install -g pnpm@9.14.2

WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

FROM node:18-alpine

RUN npm install -g serve
RUN npm install -g pnpm@9.14.2
RUN apk add --no-cache git

WORKDIR /app

COPY --from=builder /app ./app
COPY --from=builder /app/packages/app/dist ./dist

EXPOSE 3000
EXPOSE 4000

CMD ["serve", "-s", "dist", "-l", "3000"]
