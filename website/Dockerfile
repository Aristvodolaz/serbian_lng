FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# SITE_URL is baked into sitemap and canonical links at build time.
ARG SITE_URL
ENV SITE_URL=$SITE_URL
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
# Legal texts and the social-image fonts are read from disk at request/build time.
COPY --from=builder /app/src/content/legal ./src/content/legal
EXPOSE 3002
CMD ["npm", "run", "start"]
