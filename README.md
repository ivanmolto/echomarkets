<p align="center">
  <img src="web/public/logo.svg" alt="EchoMarkets" width="88" />
</p>

<h1 align="center">EchoMarkets</h1>

<p align="center">
  <strong>Now your agent can buy signals at scale.</strong><br />
  Paid prediction-market intelligence for AI agents — consumed in PayBox, executable in Dawn.
</p>

<p align="center">
  <a href="https://www.echomarkets.xyz">Website</a> ·
  <a href="https://x.com/ivanmolto/status/2094423802406908342">Demo</a> ·
  <a href="https://developer.paybox.sh/">MoonPay Hackathons · Chapter 1</a>
</p>

---

## What it is

EchoMarkets is a [PayBox](https://paybox.sh) plugin and an [x402](https://x402.org) API that sells prediction-market intelligence to AI agents, a few cents at a time. No accounts, no API keys — the payment is the credential.

| Ask your agent | Cost | What comes back |
|---|---|---|
| “Find me a market on the next Fed decision and preview it.” | free | Live odds, bid/ask spread, liquidity and resolution date from Polymarket |
| “Get me the full brief.” | 0.02 USDC | Order-book depth, 24h movement, resolution criteria and risk notes |
| “Buy the signal-follow template for this market.” | 0.10 USDC | A ready-to-run [Dawn](https://cli.dawn.ai) strategy for that market, with 24 hours of signal access |

Payments are USDC on Solana. Every paid call is an x402 proposal that PayBox shows the user for approval before it pays. EchoMarkets never holds funds or keys.

**PayBox pays. Dawn trades. EchoMarkets decides.**

## How it works

```
Agent (Claude, ChatGPT…) ──use_plugin──▶ PayBox sandbox runs plugin/dist/plugin.mjs
                                           ├─ search_markets     free · Polymarket Gamma API
                                           ├─ brief_preview      free · Polymarket Gamma + CLOB
                                           ├─ list_templates     free · no network
                                           ├─ buy_brief          x402 proposal → GET  /api/brief/{market}     0.02 USDC
                                           └─ buy_template       x402 proposal → POST /api/templates/{slug}  0.10 USDC
PayBox shows the payment → user approves → PayBox pays and retries → agent gets the brief or the Dawn .py

Dawn strategy ──Bearer token (24h, HMAC)──▶ GET /api/signal/{market}   direction · confidence · reasons
```

1. Enable **EchoMarkets** under Plugins in PayBox.
2. Ask your agent. Search and preview are free.
3. Approve the 2¢ or 10¢ payment when PayBox shows it.
4. The brief, or a personalised strategy file, lands in chat.
5. Run the strategy in Dawn (paper mode by default): `dawn strategy launch file.py --name demo`

## Repository

```
echomarkets/
├── plugin/   PayBox plugin — MCP server bundled to dist/plugin.mjs (PayBox starter v1.0.2)
└── web/      Next.js 16 app — landing page + x402 API on www.echomarkets.xyz
```

The two folders are independent (separate lockfiles, no workspace). The only shared values are the prices, which must match exactly: brief `20000` and template `100000` atomic USDC (6 decimals).

### Plugin (`plugin/`)

Requires Node 24 and pnpm 11.11.0.

```bash
cd plugin
pnpm install --frozen-lockfile
pnpm test        # type-check, deterministic build ×2, conformance
```

Upload `dist/plugin.mjs` in the PayBox developer portal. Network hosts: `www.echomarkets.xyz`, `gamma-api.polymarket.com`, `clob.polymarket.com`. The server URL can be overridden with the portal env var `ECHO_BASE`.

### Server (`web/`)

See [`web/README.md`](web/README.md) for setup, environment variables and deployment.

## API

The same routes answer any x402 client, including PayBox's `use_service`.

| Method | Route | Price | Returns |
|---|---|---|---|
| `GET` | `/api/brief/{market}` | 0.02 USDC · x402 | Full brief for one market |
| `POST` | `/api/templates/{slug}` | 0.10 USDC · x402 | Personalised Dawn strategy + 24h signal token |
| `GET` | `/api/signal/{market}` | bearer token | Direction, confidence and reasoning — polled by the strategy |
| `GET` | `/api/templates` | free | What is for sale and how to buy it |

```bash
curl -i https://www.echomarkets.xyz/api/brief/<polymarket-slug>
# → HTTP 402 Payment Required + x402 payment requirements
```

## Signals

Signals are computed from live Polymarket order books: spread, liquidity, price band and bid/ask balance. Each response returns a direction, a confidence score and the reasons behind it, so an agent or strategy can decide how much weight to give it.

**Signals are not financial advice.**

## Built with

[PayBox](https://paybox.sh) · [Dawn](https://cli.dawn.ai) · [Polymarket](https://polymarket.com) · [Solana](https://solana.com) · [x402](https://x402.org) · [Coinbase CDP](https://docs.cdp.coinbase.com/x402) · [Next.js](https://nextjs.org)

---

Built with love for [MoonPay Hackathons - Chapter 1](https://developer.paybox.sh/) from sunny Malta by [Ivan Molto](https://www.ivanmolto.com).
