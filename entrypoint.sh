#!/bin/bash
set -e

# Build Alchemy fork URL
FORK_URL="https://${DEFAULT_CHAIN}.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

echo "==> CoBuilders - ${NETWORK_NAME}"
echo "==> Fork: ${DEFAULT_CHAIN} via Alchemy"
echo "==> RPC will be available on port ${PORT}"

# Inject env vars into the HTML
sed -i \
  -e "s|__NETWORK_NAME__|${NETWORK_NAME}|g" \
  -e "s|__ALCHEMY_API_KEY__|${ALCHEMY_API_KEY}|g" \
  -e "s|__DEFAULT_CHAIN__|${DEFAULT_CHAIN}|g" \
  /var/www/html/index.html

# Generate nginx config from template
export PORT=${PORT}
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/sites-enabled/default

# Remove default nginx config that conflicts
rm -f /etc/nginx/sites-enabled/default.bak

# Start Anvil in background
anvil \
  --fork-url "${FORK_URL}" \
  --host 0.0.0.0 \
  --port 8545 \
  --block-time "${BLOCK_TIME}" \
  --accounts "${ACCOUNTS}" \
  --balance "${BALANCE}" \
  --no-rate-limit \
  --steps-tracing &

ANVIL_PID=$!

# Wait for Anvil to be ready
echo "==> Waiting for Anvil..."
for i in $(seq 1 30); do
  if wget -q -O /dev/null --post-data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' --header='Content-Type: application/json' http://127.0.0.1:8545 2>/dev/null; then
    echo "==> Anvil ready!"
    break
  fi
  sleep 1
done

# Start nginx in foreground
echo "==> Starting nginx on port ${PORT}"
exec nginx -g 'daemon off;'
