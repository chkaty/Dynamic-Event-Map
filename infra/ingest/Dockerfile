# infra/ingest/Dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["node", "/app/scripts/update_toronto_events.js"]