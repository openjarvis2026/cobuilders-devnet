FROM ghcr.io/foundry-rs/foundry:latest AS foundry

FROM nginx:alpine

# Install envsubst (part of gettext) and wget for healthcheck
RUN apk add --no-cache gettext wget

# Copy anvil from foundry image
COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil

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
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy UI
COPY www/ /usr/share/nginx/html/

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
