#!/bin/sh
exec anvil \
  --fork-url "${FORK_URL}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  --block-time "${BLOCK_TIME}" \
  --accounts "${ACCOUNTS}" \
  --balance "${BALANCE}" \
  --no-rate-limit \
  --steps-tracing
