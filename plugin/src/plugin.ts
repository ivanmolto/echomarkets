// EchoMarkets — PayBox plugin
// Paid prediction-market intelligence for AI agents. Free discovery + preview from public
// Polymarket data; x402 proposals for the paid brief and the Dawn strategy template.
//
// Sandbox rules honoured here: no network at startup/discovery, every fetch bounded to 4 s,
// no state between calls, stdout = MCP only (log to stderr), each tool well under 10 s.

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { proposeX402, x402OutputSchema } from "./paybox.js";

const PROTOCOL_VERSION = "2026-07-28";

// ---- configuration (non-sensitive; override with portal env vars) -----------------------
const ECHO_BASE = (process.env.ECHO_BASE ?? "https://www.echomarkets.xyz").replace(/\/$/, "");
// Fixed, not env-configurable: PayBox checks this against the server's 402, which accepts Solana only.
// Add Base here only once the server lists it in `accepts` too.
const CHAIN = "solana:mainnet" as const;
// Atomic USDC (6 decimals). MUST equal the server's x402 price for each route.
const PRICE_BRIEF = "20000";     // $0.02
const PRICE_TEMPLATE = "100000"; // $0.10

const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";
const FETCH_TIMEOUT_MS = 4000;

// search_markets ranking: events to pull from Gamma search before ranking by liquidity,
// and what counts as "still tradeable" (not resolving within N hours, price not pinned to 0/1).
const SEARCH_OVERFETCH = 10;
const MIN_HOURS_TO_RESOLUTION = 3;
const MIN_TRADEABLE_PRICE = 0.02;

// ---- helpers ------------------------------------------------------------------------------
function log(...a: unknown[]) { console.error("[echomarkets]", ...a); }

async function getJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// Upstream fields may be missing or non-numeric; NaN would fail the strict output schemas.
function num(v: unknown, fallback: number): number;
function num(v: unknown, fallback: null): number | null;
function num(v: unknown, fallback: number | null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") { try { return (JSON.parse(v) as unknown[]).map(String); } catch { return []; } }
  return [];
}

type GammaMarket = Record<string, unknown>;

async function getMarket(slugOrId: string) {
  const q = /^\d+$/.test(slugOrId) ? `id=${slugOrId}` : `slug=${encodeURIComponent(slugOrId)}`;
  const rows = await getJson<GammaMarket[]>(`${GAMMA}/markets?${q}`);
  const m = rows[0];
  if (!m) throw new Error(`Market not found: ${slugOrId}`);
  return {
    id: String(m.id),
    slug: String(m.slug),
    question: String(m.question ?? ""),
    endDate: (m.endDate as string | undefined) ?? null,
    active: Boolean(m.active),
    closed: Boolean(m.closed),
    liquidityUsd: num(m.liquidityNum ?? m.liquidity, 0),
    volume24hUsd: num(m.volume24hr, 0),
    outcomes: parseArray(m.outcomes),
    outcomePrices: parseArray(m.outcomePrices).map(p => num(p, null)),
    tokenIds: parseArray(m.clobTokenIds),
    resolution: String(m.description ?? "").slice(0, 400),
  };
}

async function getBook(tokenId: string) {
  type Lvl = { price: string; size: string };
  const b = await getJson<{ bids?: Lvl[]; asks?: Lvl[] }>(`${CLOB}/book?token_id=${tokenId}`);
  const prices = (lvls: Lvl[] | undefined) => (lvls ?? []).map(l => num(l.price, null)).filter((p): p is number => p !== null);
  const bids = prices(b.bids).sort((x, y) => y - x);
  const asks = prices(b.asks).sort((x, y) => x - y);
  const bestBid = bids[0] ?? null;
  const bestAsk = asks[0] ?? null;
  return {
    bestBid, bestAsk,
    spread: bestBid !== null && bestAsk !== null ? Number((bestAsk - bestBid).toFixed(4)) : null,
  };
}

const marketRef = z.string().min(1).max(200).describe("Polymarket market slug (from the URL) or numeric market id");

// ---- server -------------------------------------------------------------------------------
function createServer() {
  const server = new McpServer(
    { name: "echomarkets", version: "0.1.0" },
    { supportedProtocolVersions: [PROTOCOL_VERSION] },
  );

  // 1. search_markets — free
  server.registerTool(
    "search_markets",
    {
      title: "Search Polymarket markets",
      description: "Find active Polymarket markets by keyword. Free. Returns slugs to use with brief_preview, buy_brief and buy_template.",
      inputSchema: z.object({
        query: z.string().min(2).max(120),
        limit: z.number().int().min(1).max(10).default(5),
      }).strict(),
      outputSchema: z.object({
        markets: z.array(z.object({
          slug: z.string(), question: z.string(), yesPrice: z.number().nullable(), liquidityUsd: z.number(), endDate: z.string().nullable(),
        }).strict()),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ query, limit }) => {
      // /markets ignores free-text filters; /public-search returns matching events with nested markets.
      // Over-fetch (search ranks by recency, which favours near-resolved daily ladders), then rank ourselves.
      const res = await getJson<{ events?: { markets?: GammaMarket[] }[] }>(
        `${GAMMA}/public-search?q=${encodeURIComponent(query)}&limit_per_type=${SEARCH_OVERFETCH}&events_status=active`,
      );
      const rows = (res.events ?? [])
        .flatMap(e => e.markets ?? [])
        .filter(m => m.slug && m.closed !== true && m.active !== false)
        .map(m => {
          const prices = parseArray(m.outcomePrices);
          return {
            slug: String(m.slug),
            question: String(m.question ?? ""),
            yesPrice: num(prices[0], null),
            liquidityUsd: num(m.liquidityNum ?? m.liquidity, 0),
            endDate: (m.endDate as string | undefined) ?? null,
          };
        })
        .sort((a, b) => b.liquidityUsd - a.liquidityUsd);
      // Prefer markets with something left to trade: not about to resolve, price not already at 0 or 1.
      // Fall back to the rest so a thin query still returns what exists.
      const minEnd = Date.now() + MIN_HOURS_TO_RESOLUTION * 3_600_000;
      const tradeable = (m: typeof rows[number]) => {
        const end = m.endDate ? Date.parse(m.endDate) : NaN;
        if (Number.isFinite(end) && end < minEnd) return false;
        if (m.yesPrice !== null && (m.yesPrice < MIN_TRADEABLE_PRICE || m.yesPrice > 1 - MIN_TRADEABLE_PRICE)) return false;
        return true;
      };
      const markets = [...rows.filter(tradeable), ...rows.filter(m => !tradeable(m))].slice(0, limit);
      const text = markets.length
        ? markets.map(m => `• ${m.question} — yes ${m.yesPrice ?? "?"} · liq $${Math.round(m.liquidityUsd).toLocaleString()} · slug ${m.slug}`).join("\n")
        : `No active markets matched "${query}".`;
      return { content: [{ type: "text", text }], structuredContent: { markets } };
    },
  );

  // 2. brief_preview — free
  server.registerTool(
    "brief_preview",
    {
      title: "Free market preview",
      description: "Current odds, order-book spread and liquidity for one Polymarket market, from public data. Free. For the full brief (resolution analysis, movement, notes) use buy_brief.",
      inputSchema: z.object({ market: marketRef }).strict(),
      outputSchema: z.object({
        slug: z.string(), question: z.string(), active: z.boolean(), closed: z.boolean(), endDate: z.string().nullable(),
        liquidityUsd: z.number(), volume24hUsd: z.number(),
        outcomes: z.array(z.object({
          name: z.string(), price: z.number(), bestBid: z.number().nullable(), bestAsk: z.number().nullable(), spread: z.number().nullable(),
        }).strict()),
        fullBrief: z.object({ tool: z.literal("buy_brief"), priceUsdc: z.string() }).strict(),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ market }) => {
      const m = await getMarket(market);
      const books = await Promise.all(m.tokenIds.slice(0, 2).map(getBook));
      const outcomes = m.outcomes.slice(0, 2).map((name, i) => ({
        name, price: m.outcomePrices[i] ?? 0, bestBid: books[i]?.bestBid ?? null, bestAsk: books[i]?.bestAsk ?? null, spread: books[i]?.spread ?? null,
      }));
      const out = {
        slug: m.slug, question: m.question, active: m.active, closed: m.closed, endDate: m.endDate,
        liquidityUsd: m.liquidityUsd, volume24hUsd: m.volume24hUsd, outcomes,
        fullBrief: { tool: "buy_brief" as const, priceUsdc: "0.02" },
      };
      const text = [
        m.question,
        ...outcomes.map(o => `  ${o.name}: ${o.price.toFixed(2)} (bid ${o.bestBid ?? "—"} / ask ${o.bestAsk ?? "—"}, spread ${o.spread ?? "—"})`),
        `  liquidity $${Math.round(m.liquidityUsd).toLocaleString()} · 24h vol $${Math.round(m.volume24hUsd).toLocaleString()}${m.endDate ? ` · resolves ${m.endDate}` : ""}`,
        `Full brief with resolution analysis: buy_brief (0.02 USDC via x402).`,
      ].join("\n");
      return { content: [{ type: "text", text }], structuredContent: out };
    },
  );

  // 3. buy_brief — x402 proposal ($0.02)
  server.registerTool(
    "buy_brief",
    {
      title: "Buy full market brief",
      description: `Proposes an x402 payment of 0.02 USDC for the full EchoMarkets brief on one Polymarket market: odds, order-book depth, movement, resolution criteria and risk notes. PayBox will show the payment for approval and return the brief in the request result.`,
      inputSchema: z.object({ market: marketRef }).strict(),
      outputSchema: x402OutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ market }) => {
      const slug = encodeURIComponent(market.trim());
      log("proposing brief for", slug);
      return proposeX402({ chain: CHAIN, url: `${ECHO_BASE}/api/brief/${slug}`, maxAmount: PRICE_BRIEF, method: "GET" });
    },
  );

  // 4. buy_template — x402 proposal ($0.10)
  server.registerTool(
    "buy_template",
    {
      title: "Buy a Dawn strategy template",
      description: `Proposes an x402 payment of 0.10 USDC for a ready-to-run Dawn (cli.dawn.ai) strategy, personalised to one Polymarket market, with 24 hours of EchoMarkets signal access embedded. Templates: signal-follow (buy when signal confidence clears a threshold), event-trigger (act on an external feed inside a time window), mean-reversion (buy on a price drop vs baseline). The paid response contains the Python file and the dawn launch command.`,
      inputSchema: z.object({
        template: z.enum(["signal-follow", "event-trigger", "mean-reversion"]),
        market: marketRef,
        outcome: z.number().int().min(0).max(1).default(0).describe("0 = first outcome (usually Yes), 1 = second"),
        size_usd: z.number().min(1.01).max(1000).optional().describe("Per-buy size in USD (Polymarket minimum 1.01)"),
        threshold: z.number().min(0).max(1).optional().describe("signal-follow: minimum confidence 0..1"),
        drop_pct: z.number().min(0.5).max(50).optional().describe("mean-reversion: trigger drop in percent"),
        hours: z.number().int().min(1).max(168).optional().describe("Run length in hours"),
        feed_url: z.string().url().max(500).optional().describe("event-trigger: public JSON feed to watch (default: USGS earthquakes)"),
        window_start: z.string().datetime({ offset: true }).optional().describe("event-trigger: ISO 8601 start of the active window (default: now)"),
        window_end: z.string().datetime({ offset: true }).optional().describe("event-trigger: ISO 8601 end of the active window (default: none)"),
      }).strict(),
      outputSchema: x402OutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ template, market, outcome, size_usd, threshold, drop_pct, hours, feed_url, window_start, window_end }) => {
      const body: Record<string, string | number> = { market: market.trim(), outcome };
      if (size_usd !== undefined) body.size_usd = size_usd;
      if (threshold !== undefined) body.threshold = threshold;
      if (drop_pct !== undefined) body.drop_pct = drop_pct;
      if (hours !== undefined) body.hours = hours;
      if (feed_url !== undefined) body.feed_url = feed_url;
      if (window_start !== undefined) body.window_start = window_start;
      if (window_end !== undefined) body.window_end = window_end;
      log("proposing template", template, "for", body.market);
      return proposeX402({ chain: CHAIN, url: `${ECHO_BASE}/api/templates/${template}`, maxAmount: PRICE_TEMPLATE, method: "POST", body });
    },
  );

  // 5. list_templates — free, static (no network)
  server.registerTool(
    "list_templates",
    {
      title: "List strategy templates",
      description: "What EchoMarkets sells and how to buy it. Free, no network.",
      inputSchema: z.object({}).strict(),
      outputSchema: z.object({
        priceUsdc: z.object({ brief: z.string(), template: z.string() }).strict(),
        chain: z.string(),
        templates: z.array(z.object({ slug: z.string(), description: z.string(), params: z.array(z.string()) }).strict()),
        run: z.string(),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const out = {
        priceUsdc: { brief: "0.02", template: "0.10" },
        chain: CHAIN,
        templates: [
          { slug: "signal-follow", description: "Polls the EchoMarkets signal; buys when confidence ≥ threshold. Simulates first; budget-aware.", params: ["market", "outcome", "threshold", "size_usd", "hours"] },
          { slug: "event-trigger", description: "Sleeps until a window, watches an external JSON feed, buys when the condition fires.", params: ["market", "outcome", "feed_url", "window_start", "window_end", "size_usd", "hours"] },
          { slug: "mean-reversion", description: "Buys when the outcome price drops more than drop_pct from the recent baseline.", params: ["market", "outcome", "drop_pct", "size_usd", "hours"] },
        ],
        run: "dawn strategy launch <file>.py --name <run>   # paper mode by default; add --live --budget N for real funds",
      };
      const text = out.templates.map(t => `• ${t.slug} — ${t.description}`).join("\n") + `\nBrief 0.02 USDC · Template 0.10 USDC · ${CHAIN}`;
      return { content: [{ type: "text", text }], structuredContent: out };
    },
  );

  return server;
}

serveStdio(createServer, { legacy: "reject" });
