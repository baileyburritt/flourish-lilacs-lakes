# F4 (§13): Fly.io deploy image for the Fastify API.
#
# Two-stage build because `npm run build` (tsc) needs devDependencies
# (typescript) that have no reason to ship in the runtime image. The build
# stage compiles src/ to dist/ with a full `npm ci`; the runtime stage
# reinstalls with `npm ci --omit=dev` and copies only the compiled output
# plus the SQL migration files `drizzle-orm`'s migrator reads at runtime
# (see src/db/migrate.ts, invoked here via fly.toml's release_command).
#
# Pinned to node:24-slim to match the Node 24 pinned in .github/workflows/ci.yml
# and .nvmrc-equivalent expectations elsewhere in this repo — keep these in
# sync if that version ever changes.

FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/index.js"]
