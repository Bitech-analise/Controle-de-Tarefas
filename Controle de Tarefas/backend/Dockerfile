FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY src ./src

EXPOSE 4000

CMD ["sh", "-c", "npm run db:push && if [ \"$RUN_DB_SEED\" = \"true\" ]; then npm run db:seed; fi && npm run start"]
