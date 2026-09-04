# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

# NEXT_PUBLIC_API_URL se inlinea en el bundle de Next.js durante el build y queda fija ahí: el
# runtime no la puede cambiar. Puede ser una URL interna a la red del compose porque solo la usan
# RSC y server actions server-side: el browser pega contra paths relativos /api/... que el rewrite
# de next.config.ts manda al backend.
#
# Sin default a propósito: la imagen es para un deploy concreto, y un default horneado en
# silencio (localhost, por ejemplo) es un bug que no se nota hasta que ya está en producción.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "NEXT_PUBLIC_API_URL build-arg is required (e.g. http://api:8080)"; exit 1; }
# El runtime stage copia .next/standalone: next.config.ts solo lo genera con esta variable puesta.
ENV NEXT_OUTPUT=standalone
RUN bun run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# server.js de standalone escucha en process.env.HOSTNAME, y Docker define esa variable con el id
# corto del contenedor: con web en dos redes eso ata el server a una sola IP y Traefik puede
# pegarle a la otra. Es la misma línea que trae el ejemplo oficial with-docker de Next.js.
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

CMD ["bun", "server.js"]
