#!/bin/bash
set -e

# Build Alchemy fork URL
FORK_URL="https://${DEFAULT_CHAIN}.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

# Determine public RPC URL
# Railway provides RAILWAY_PUBLIC_DOMAIN automatically
if [ -n "${RAILWAY_PUBLIC_DOMAIN}" ]; then
  PUBLIC_RPC="https://${RAILWAY_PUBLIC_DOMAIN}/rpc"
else
  PUBLIC_RPC="http://localhost:${PORT}/rpc"
fi

echo "==> CoBuilders - ${NETWORK_NAME}"
echo "==> Fork: ${DEFAULT_CHAIN} via Alchemy"
echo "==> Public RPC: ${PUBLIC_RPC}"
echo "==> Starting on port ${PORT}"

# Inject RPC URL into the built Next.js files
# The placeholder __RPC_URL__ was baked into the chain definition at build time
find /app/.next -type f -name '*.js' -exec sed -i "s|__RPC_URL__|${PUBLIC_RPC}|g" {} +

# Generate nginx config
export PORT=${PORT}
envsubst '${PORT}' < /etc/nginx/sites-available/default.template > /etc/nginx/sites-enabled/default

# Start Anvil in background with custom chain ID (not 31337 to avoid SE-2 "local chain" detection)
anvil \
  --fork-url "${FORK_URL}" \
  --host 0.0.0.0 \
  --port 8545 \
  --chain-id 13370 \
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
