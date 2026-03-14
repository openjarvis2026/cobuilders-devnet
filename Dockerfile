FROM ghcr.io/foundry-rs/foundry:latest AS foundry

# ========== Build SE-2 ==========
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /build
RUN git clone --depth 1 https://github.com/scaffold-eth/scaffold-eth-2.git .

# Copy our custom config and chain definition
COPY scaffold-eth/scaffold.config.ts packages/nextjs/scaffold.config.ts
COPY scaffold-eth/cobuildersChain.ts packages/nextjs/utils/scaffold-eth/cobuildersChain.ts
COPY scaffold-eth/wagmiConfig.tsx packages/nextjs/services/web3/wagmiConfig.tsx
COPY scaffold-eth/rpc-proxy-route.ts packages/nextjs/app/api/rpc/route.ts

# Install dependencies and build
RUN yarn install --immutable || yarn install

ENV NEXT_TELEMETRY_DISABLED=1
# Allow build even with type warnings
ENV NEXT_PUBLIC_IGNORE_BUILD_ERROR=true
RUN yarn workspace @se-2/nextjs build

# ========== Runtime ==========
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    wget \
    ca-certificates \
    gettext-base \
  && rm -rf /var/lib/apt/lists/*

# Copy anvil
COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil

# Copy built Next.js app
WORKDIR /app
COPY --from=builder /build/packages/nextjs/.next ./.next
COPY --from=builder /build/packages/nextjs/public ./public
COPY --from=builder /build/packages/nextjs/package.json ./package.json
COPY --from=builder /build/packages/nextjs/node_modules ./node_modules
COPY --from=builder /build/packages/nextjs/next.config.ts ./next.config.ts

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/sites-available/default.template

# Environment variables
ENV NETWORK_NAME=Devnet
ENV ALCHEMY_API_KEY=demo
ENV DEFAULT_CHAIN=base-mainnet
ENV BLOCK_TIME=2
ENV PORT=8080
ENV ACCOUNTS=10
ENV BALANCE=10000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
