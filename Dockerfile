FROM ghcr.io/foundry-rs/foundry:latest

ENV FORK_URL=https://mainnet.base.org
ENV BLOCK_TIME=2
ENV PORT=8545
ENV ACCOUNTS=10
ENV BALANCE=10000

EXPOSE 8545

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
