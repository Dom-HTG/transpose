# -----------------------------
# Stage 1: builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


# -----------------------------
# Stage 2: minimal runtime
# -----------------------------

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm install --omit=dev

EXPOSE 3059

CMD ["node", "dist/index.js"]
