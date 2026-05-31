FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
    COPY --from=builder /app/dist dist
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/package-lock.json ./
    RUN npm ci --omit=dev
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
