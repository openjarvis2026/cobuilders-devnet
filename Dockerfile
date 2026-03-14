FROM ghcr.io/foundry-rs/foundry:latest

USER root

# Install nginx and envsubst (gettext)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gettext-base \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Environment variables
ENV NETWORK_NAME=Devnet
ENV ALCHEMY_API_KEY=demo
ENV DEFAULT_CHAIN=base-mainnet
ENV BLOCK_TIME=2
ENV PORT=8080
ENV ACCOUNTS=10
ENV BALANCE=10000

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy UI
COPY www/ /var/www/html/

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
