#!/bin/bash
set -e

# Build Alchemy fork URL
FORK_URL="https://${DEFAULT_CHAIN}.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

echo "==> CoBuilders - ${NETWORK_NAME}"
echo "==> Fork: ${DEFAULT_CHAIN} via Alchemy"
echo "==> Starting on port ${PORT}"

# Generate nginx config
export PORT=${PORT}
envsubst '${PORT}' < /etc/nginx/sites-available/default.template > /etc/nginx/sites-enabled/default

# Start Anvil in background
anvil \
  --fork-url "${FORK_URL}" \
  --host 0.0.0.0 \
  --port 8545 \
  --chain-id 31337 \
  --block-time "${BLOCK_TIME}" \
  --accounts "${ACCOUNTS}" \
  --balance "${BALANCE}" \
  --no-rate-limit \
  --steps-tracing &

ANVIL_PID=$!

# Wait for Anvil
echo "==> Waiting for Anvil..."
for i in $(seq 1 60); do
  if wget -q -O /dev/null --post-data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' --header='Content-Type: application/json' http://127.0.0.1:8545 2>/dev/null; then
    echo "==> Anvil ready!"
    break
  fi
  sleep 1
done

# Start Next.js in background
echo "==> Starting Next.js..."
cd /app
NODE_ENV=production npx next start -p 3000 &

# Wait for Next.js
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://127.0.0.1:3000 2>/dev/null; then
    echo "==> Next.js ready!"
    break
  fi
  sleep 1
done

# Start nginx in foreground
echo "==> Starting nginx on port ${PORT}"
exec nginx -g 'daemon off;'
