FROM mcr.microsoft.com/playwright:v1.52.0 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.52.0 AS runner
WORKDIR /app
RUN groupadd --system app && useradd --system --ingroup app app
COPY --from=builder /app/dist dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /app/data && chown -R app:app /app/data
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
