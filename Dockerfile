FROM ghcr.io/foundry-rs/foundry:latest

# Default env vars (override in Railway)
ENV FORK_URL=https://mainnet.base.org
ENV FORK_BLOCK_NUMBER=latest
ENV BLOCK_TIME=2
ENV PORT=8545
ENV ACCOUNTS=10
ENV BALANCE=10000

EXPOSE ${PORT}

ENTRYPOINT anvil \
  --fork-url ${FORK_URL} \
  $([ "${FORK_BLOCK_NUMBER}" != "latest" ] && echo "--fork-block-number ${FORK_BLOCK_NUMBER}") \
  --host 0.0.0.0 \
  --port ${PORT} \
  --block-time ${BLOCK_TIME} \
  --accounts ${ACCOUNTS} \
  --balance ${BALANCE} \
  --no-rate-limit \
  --steps-tracing
