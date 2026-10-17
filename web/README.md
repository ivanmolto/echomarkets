# EchoMarkets — server

Next.js 16 app behind [www.echomarkets.xyz](https://www.echomarkets.xyz): the landing page and the x402 API that the EchoMarkets PayBox plugin proposes payments to. Started from the Solana Foundation [`x402-template`](https://github.com/solana-foundation/templates/tree/main/community/x402-template).

## Stack

- Next.js 16 (App Router). The paywall lives in `proxy.ts` — Next 16's replacement for `middleware.ts`.
- `x402-next` 1.x for the 402 responses, `@coinbase/x402` 1.x for the CDP facilitator on mainnet.
- Polymarket public APIs (Gamma + CLOB) for market data — no keys.

## Layout

```
proxy.ts                         x402 paywall: GET /api/brief/* $0.02 · POST /api/templates/* $0.10
app/page.tsx                     landing page (+ page.module.css)
app/api/brief/[market]           paid brief
app/api/templates                free index of templates
app/api/templates/[slug]         paid Dawn strategy + 24h signal token
app/api/signal/[market]          signal for a running strategy (Bearer token)
lib/polymarket.ts                Gamma + CLOB client
lib/signal.ts                    brief and signal logic
lib/tokens.ts                    HMAC-signed 24h signal tokens
lib/templates.ts                 Dawn .py generator
```

## Run locally

```bash
npm install
cp .env.example .env.local     # then fill it in
npm run dev
```

Check it:

```bash
curl -i localhost:3000/api/brief/<polymarket-slug>   # 402 with payment requirements
curl localhost:3000/api/templates                     # 200
curl -i localhost:3000/api/signal/<polymarket-slug>  # 401 without a token
```

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_RECEIVER_ADDRESS` | Solana wallet that receives the USDC |
| `NEXT_PUBLIC_NETWORK` | `solana-devnet` for testing, `solana` for mainnet (x402 v1 name — not `solana-mainnet-beta`) |
| `NEXT_PUBLIC_FACILITATOR_URL` | Devnet only; defaults to `https://x402.org/facilitator` |
| `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` | Mainnet only: CDP secret API key for the facilitator. Server-side — never `NEXT_PUBLIC_` |
| `SIGNAL_SECRET` | HMAC key for signal tokens (`openssl rand -hex 32`). Required at **build** time. Changing it invalidates every issued token |
| `NEXT_PUBLIC_BASE_URL` | Public URL used in generated strategies and links, e.g. `https://www.echomarkets.xyz` |
| `NEXT_PUBLIC_X_POST` | Optional: demo post on X, shown in the top bar and footer |

## Deploy (Vercel)

- Root Directory: `web`
- Set every variable above in Project → Settings → Environment Variables before the first build.
- `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.
- The plugin calls the exact host it is configured with, and PayBox does not follow redirects. Keep `NEXT_PUBLIC_BASE_URL`, the plugin's `ECHO_BASE` and the portal network host on the same domain.

## Prices

Brief `$0.02` = `20000` and template `$0.10` = `100000` atomic USDC. They must equal the plugin's `maxAmount` (`plugin/src/plugin.ts`) — change both or neither.
