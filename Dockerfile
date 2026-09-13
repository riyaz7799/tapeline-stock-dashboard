# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so they must be passed as build args
# and re-exported before `npm run build` runs.
ARG VITE_STOCK_API_BASE_URL=""
ARG VITE_STOCK_API_KEY=""
ARG VITE_MOCK_FAILURE_RATE="0.18"
ENV VITE_STOCK_API_BASE_URL=$VITE_STOCK_API_BASE_URL
ENV VITE_STOCK_API_KEY=$VITE_STOCK_API_KEY
ENV VITE_MOCK_FAILURE_RATE=$VITE_MOCK_FAILURE_RATE

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
