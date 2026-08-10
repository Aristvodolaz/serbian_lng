# --- deps + build ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- production runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Runs as the image's built-in non-root "node" user rather than root — it
# needs to own /app since main.ts writes openapi.json into the workdir.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
