FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY src ./src

EXPOSE 4000

CMD ["sh", "-c", "npm run db:push && npm run db:seed && npm run start"]
