#
# 1 // BUILD STAGE
#
FROM node:18-buster-slim AS builder
WORKDIR /app
RUN npm install -g typescript
RUN npm install -g pnpm

COPY package*.json /app/
COPY pnpm-lock.yaml /app/
RUN pnpm install

COPY src /app/src/
COPY tsconfig.json /app/
COPY eslint.config.js /app/

# For testing only
COPY test-core /app/test-core/

# Prepate dist
RUN tsc -b 
RUN npx eslint .

# For testing only
RUN npm install -g typescript mocha
RUN LOG_SETUP=prod mocha dist/test-core/**/*.js --recursive --exit


# ######################################################
# 2 // FINAL IMAGE
#
FROM node:18-buster-slim
WORKDIR /app
COPY --from=builder /app/dist/src /app/dist/
COPY --from=builder /app/node_modules /app/node_modules/
COPY package*.json /app/

# Specific files to this project
COPY .env /app/

ENV TZ=UTC
ENV LOG_SETUP=prod

ENTRYPOINT ["node", "dist/App.js"]