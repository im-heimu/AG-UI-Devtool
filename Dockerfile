# syntax=docker/dockerfile:1
# Development image: runs `next dev`, so the Inspector is available.
FROM node:24-alpine

ENV NEXT_TELEMETRY_DISABLED=1 \
    COPILOTKIT_TELEMETRY_DISABLED=true \
    SCARF_ANALYTICS=false

WORKDIR /app
RUN chown node:node /app
USER node

# Dependencies first: this layer is reused until the lockfile changes.
COPY --chown=node:node package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --no-audit --no-fund

COPY --chown=node:node . .
# Mount point of the build cache volume. Created here, so a new volume
# is owned by node instead of root.
RUN mkdir .next

EXPOSE 3000
CMD ["node_modules/.bin/next", "dev", "--hostname", "0.0.0.0"]
