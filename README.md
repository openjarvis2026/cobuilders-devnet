# CoBuilders Devnet

Persistent Anvil fork for blockchain development & testing. Deploy N instances on Railway — each one serves its own UI + RPC.

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ALCHEMY_API_KEY` | Your Alchemy API key | `abc123...` |
| `NETWORK_NAME` | Instance name (displays as "CoBuilders - {name}") | `Staging` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_CHAIN` | `base-mainnet` | Initial fork source |
| `BLOCK_TIME` | `2` | Seconds between blocks |
| `ACCOUNTS` | `10` | Number of pre-funded accounts |
| `BALANCE` | `10000` | ETH per account |
| `PORT` | `8080` | Server port |

## Features

- **Self-contained UI** — each deployment serves its own dashboard
- **Chain switcher** — switch between Base, Optimism, Ethereum, Arbitrum, Polygon, zkSync from the UI
- **Fork reset** — wipe state and re-fork from latest on-chain data
- **MetaMask integration** — one-click add network
- **Pre-funded accounts** — 10 deterministic Anvil accounts with configurable balance
- **RPC endpoint** — available at `{your-url}/rpc`

## Architecture

```
nginx (:PORT)
  GET /     → Static UI (dashboard)
  POST /rpc → Proxy to Anvil (:8545)

anvil (:8545) → Fork of selected chain via Alchemy
```

## Supported Chains

| Chain | Alchemy Path |
|-------|-------------|
| Base Mainnet | `base-mainnet` |
| Optimism Mainnet | `opt-mainnet` |
| Ethereum Mainnet | `eth-mainnet` |
| Arbitrum One | `arb-mainnet` |
| Polygon Mainnet | `polygon-mainnet` |
| zkSync Era | `zksync-mainnet` |

## Local Development

```bash
docker build -t cobuilders-devnet .
docker run -p 8080:8080 \
  -e ALCHEMY_API_KEY=your_key \
  -e NETWORK_NAME=Local \
  cobuilders-devnet
```

Open http://localhost:8080

---

Built by [CoBuilders](https://cobuilders.xyz)
