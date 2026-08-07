# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

ARG VITE_APP_API_URL=""
ARG VITE_APP_R2_PUBLIC_ENDPOINT=""
ARG VITE_APP_ROUTE_SECRET_KEY=""

RUN set -eu; \
    [ -n "${VITE_APP_API_URL:-}" ]            || unset VITE_APP_API_URL; \
    [ -n "${VITE_APP_R2_PUBLIC_ENDPOINT:-}" ] || unset VITE_APP_R2_PUBLIC_ENDPOINT; \
    [ -n "${VITE_APP_ROUTE_SECRET_KEY:-}" ]   || unset VITE_APP_ROUTE_SECRET_KEY; \
    npm run build

FROM nginx:alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
