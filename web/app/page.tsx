// app/page.tsx — EchoMarkets landing (static, dark + gold)
// Leads with the request you'd type to your agent (pattern from paybox.sh); layout rhythm
// (product mockup hero, built-on row, stats band, numbered steps, FAQ, closing CTA) from areta.market.

import Link from "next/link";
import s from "./page.module.css";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.echomarkets.xyz";
const X_POST = process.env.NEXT_PUBLIC_X_POST ?? ""; // set after the demo video is posted
const DEMO_VIDEO = "https://youtu.be/pezbIIMvXMM";
const REPO = "https://github.com/ivanmolto/echomarkets";
const X_PROFILE = "https://x.com/echo_markets";
const PAYBOX_PLUGINS = "https://app.paybox.sh/plugins";

const builtOn: [string, string][] = [
  ["PayBox", "https://paybox.sh"],
  ["Dawn", "https://cli.dawn.ai"],
  ["Polymarket", "https://polymarket.com"],
  ["Solana", "https://solana.com"],
  ["x402", "https://x402.org"],
];

const asks = [
  {
    say: "“Find me a market on the next Fed decision and preview it.”",
    cost: "free",
    gets: "Live odds, bid/ask spread, liquidity and resolution date — straight from Polymarket, no payment.",
    tool: "search_markets · brief_preview",
  },
  {
    say: "“Get me the full brief.”",
    cost: "0.02 USDC",
    gets: "Order-book depth, 24h movement, resolution criteria and risk notes. PayBox shows the payment; you approve; the brief lands in chat.",
    tool: "buy_brief → x402",
  },
  {
    say: "“Buy the signal-follow template for this market.”",
    cost: "0.10 USDC",
    gets: "A ready-to-run Dawn strategy personalised to the market, with 24 hours of EchoMarkets signal access embedded. Paper mode by default.",
    tool: "buy_template → x402",
  },
];

const stats = [
  {
    pre: "per brief",
    num: "2¢",
    label: "Odds, depth, movement and resolution for one market.",
  },
  {
    pre: "per strategy",
    num: "10¢",
    label: "A runnable Dawn file plus 24h of signal access.",
  },
  {
    pre: "accounts · API keys",
    num: "0",
    label: "The x402 payment is the credential.",
  },
  {
    pre: "one conversation",
    num: "Ask → Run",
    label: "From question to paper strategy.",
  },
];

const steps = [
  {
    title: "Enable the plugin",
    text: "In PayBox, open Plugins and switch on EchoMarkets.",
  },
  {
    title: "Ask your agent",
    text: "Search and preview are free. Claude, ChatGPT or any PayBox-connected agent.",
  },
  {
    title: "Approve in PayBox",
    text: "Every paid call is an x402 proposal you see first: 2¢ or 10¢ in USDC on Solana.",
  },
  {
    title: "Get the brief or file",
    text: "The paid response lands in chat. Templates arrive personalised to the market.",
  },
  {
    title: "Launch in Dawn",
    text: "dawn strategy launch file.py — paper mode, polling the signal with its 24h token.",
  },
];

const endpoints: [string, string, string, string][] = [
  [
    "GET",
    "/api/brief/{market}",
    "0.02 USDC · x402",
    "Full brief for one market",
  ],
  [
    "POST",
    "/api/templates/{slug}",
    "0.10 USDC · x402",
    "Personalised Dawn strategy + 24h signal token",
  ],
  [
    "GET",
    "/api/signal/{market}",
    "bearer token",
    "Direction · confidence · reasoning — polled by the strategy",
  ],
  ["GET", "/api/templates", "free", "What is for sale and how to buy it"],
];

const faqs = [
  {
    q: "Does EchoMarkets hold my funds or keys?",
    a: "No. EchoMarkets only proposes payments. PayBox shows each x402 proposal to you, you approve it, and PayBox pays from your own wallet. Dawn trades from your own wallet too.",
  },
  {
    q: "How is the signal computed?",
    a: "From live Polymarket order books: spread, liquidity, price band and bid/ask balance. Each response returns a direction, a confidence score and the reasons behind it, so your agent or strategy can decide how much weight to give it.",
  },
  {
    q: "How good is the signal?",
    a: "It’s a transparent heuristic, not a model. Every response includes its reasons so you can judge. A public hit-rate page is on the roadmap.",
  },
  {
    q: "How does EchoMarkets fit with Dawn?",
    a: "EchoMarkets supplies a signal Dawn strategies can act on. You don’t need Dawn to start — briefs work in any PayBox-connected agent, with no account or terminal. When you want it to run on its own, the template turns a brief into a ready-to-run Dawn strategy with 24 hours of signal access.",
  },
  {
    q: "What chain and token do I pay with?",
    a: "USDC on Solana mainnet, through PayBox or any x402 client. Prices are fixed per call: 0.02 USDC for a brief, 0.10 USDC for a template.",
  },
  {
    q: "Can I use it without the PayBox plugin?",
    a: "Yes. The same endpoints answer any x402 client, including PayBox’s use_service. Request a paid route without payment and you get a standard 402 with the payment requirements.",
  },
  {
    q: "Is the plugin live in the PayBox marketplace?",
    a: "It’s submitted for review as part of MoonPay Hackathons Chapter 1. Until it’s approved, anyone can use the endpoints directly via x402 — see the API section.",
  },
];

export default function Home() {
  return (
    <main className={s.page}>
      <div className={s.announce}>
        Built for MoonPay Hackathons · Chapter 1 —{" "}
        {X_POST ? (
          <a href={X_POST} target="_blank" rel="noopener noreferrer">
            Watch the demo video on X →
          </a>
        ) : (
          <a href="#how">See how it works →</a>
        )}
      </div>

      <div className={s.wrap}>
        <header className={s.header}>
          <Link href="/" className={s.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="EchoMarkets" width={32} height={32} />
            <span aria-hidden="true">
              ECHO<span className={s.gold}>MARKETS</span>
            </span>
          </Link>
          <nav className={s.nav}>
            <a href="#how">How it works</a>
            <a href="#api">API</a>
            <a href="#faq">FAQ</a>
          </nav>
        </header>

        {/* Hero */}
        <section className={s.hero}>
          <div className={s.glow} aria-hidden />
          <div className={s.heroCopy}>
            <span className={s.eyebrow}>
              <span className={s.dot} /> Consumed in PayBox · Executable in Dawn
            </span>
            <h1 className={s.h1}>
              Now your agent can{" "}
              <span className={s.goldText}>buy the signal.</span>
            </h1>
            <p className={s.lede}>
              Prediction-market intelligence for AI agents, sold a few cents at
              a time over x402. No accounts, no API keys — the payment is the
              credential.
            </p>
            <div className={s.ctas}>
              <a href="#api" className={`${s.btn} ${s.btnGold}`}>
                Use the x402 API →
              </a>
              <a
                href={PAYBOX_PLUGINS}
                className={`${s.btn} ${s.btnGhost}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enable in PayBox · pending review
              </a>
            </div>
            <div className={s.pills}>
              <span className={s.pill}>
                <span className={s.dot} />
                Polymarket data
              </span>
              <span className={s.pill}>
                <span className={s.dot} />
                USDC on Solana
              </span>
              <span className={s.pill}>
                <span className={s.dot} />
                Dawn strategies
              </span>
            </div>
          </div>

          <HeroMock />
        </section>
      </div>

      {/* Built on */}
      <div className={s.wrap}>
        <div className={s.builtOn}>
          <small>Built on</small>
          {builtOn.map(([name, href]) => (
            <a
              key={name}
              href={href}
              className={s.wordmark}
              target="_blank"
              rel="noopener noreferrer"
            >
              {name}
            </a>
          ))}
        </div>
      </div>

      <div className={s.wrap}>
        {/* Three asks */}
        <section id="how" className={s.section}>
          <p className={s.kicker}>What you’d type</p>
          <h2 className={s.h2}>
            Say it to your agent. PayBox handles the money.
          </h2>
          <p className={s.sub}>
            Start free, pay only when you want depth, and leave with a strategy
            you can run.
          </p>
          <div className={s.asks}>
            {asks.map((a, i) => (
              <article key={a.say} className={s.ask}>
                <div className={s.askTop}>
                  <span className={s.askNum}>0{i + 1}</span>
                  <span
                    className={`${s.price} ${a.cost !== "free" ? s.pricePaid : ""}`}
                  >
                    {a.cost}
                  </span>
                </div>
                <p className={s.askSay}>{a.say}</p>
                <p className={s.askGets}>{a.gets}</p>
                <p className={s.askTool}>{a.tool}</p>
              </article>
            ))}
          </div>

          <div className={s.stats}>
            {stats.map((st) => (
              <div key={st.pre} className={s.stat}>
                <div className={s.statPre}>{st.pre}</div>
                <div className={`${s.statNum} ${s.goldText}`}>{st.num}</div>
                <div className={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className={`${s.section} ${s.why}`}>
          <div>
            <p className={s.kicker}>Why this exists</p>
            <h2 className={s.h2}>
              Dawn sells the data. PayBox holds the wallet. Nobody was selling
              the conclusion.
            </h2>
            <p className={s.sub}>
              Dawn’s strategies can pull raw feeds — tweets, odds, web pages —
              and reason about them. EchoMarkets sells what comes out the other
              end: a direction, a confidence, and the reasons, for any agent
              with a PayBox wallet. Two cents, no account.
            </p>
          </div>
          <blockquote className={s.quote}>
            <span className={s.quoteMark} aria-hidden>
              “
            </span>
            <p className={s.quoteText}>
              Dawn’s LLM can write the strategy.{" "}
              <span className={s.goldText}>
                EchoMarkets tells it when to act.
              </span>
            </p>
            <p className={s.quoteBy}>EchoMarkets</p>
          </blockquote>
        </section>

        {/* Steps */}
        <section className={s.section}>
          <p className={s.kicker}>How it works</p>
          <h2 className={s.h2}>
            From question to paper strategy in five steps.
          </h2>
          <ol className={s.steps}>
            {steps.map((st, i) => (
              <li key={st.title} className={s.step}>
                <span className={s.stepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={s.stepTitle}>{st.title}</p>
                <p className={s.stepText}>{st.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Inside the strategy */}
        <section className={s.section}>
          <p className={s.kicker}>Inside the strategy</p>
          <h2 className={s.h2}>
            The signal is plain JSON. The strategy is plain Python.
          </h2>
          <p className={s.sub}>
            The template polls <code className={s.code}>/api/signal</code> with
            its 24h token, simulates before it buys, gates on price impact and
            respects your Dawn budget.
          </p>
          <div className={s.duo}>
            <div className={s.term}>
              <div className={s.termBar}>
                <span>GET /api/signal/{"{market}"}</span>
                <span>200</span>
              </div>
              <pre>
                {"{\n"}
                {"  "}
                <span className={s.k}>&quot;direction&quot;</span>:{" "}
                <span className={s.s}>&quot;buy&quot;</span>,{"\n"}
                {"  "}
                <span className={s.k}>&quot;confidence&quot;</span>: 0.72,{"\n"}
                {"  "}
                <span className={s.k}>&quot;reasoning&quot;</span>: [{"\n"}
                {"    "}
                <span className={s.s}>&quot;tight spread 1.0¢&quot;</span>,
                {"\n"}
                {"    "}
                <span className={s.s}>&quot;liquidity $184,220&quot;</span>,
                {"\n"}
                {"    "}
                <span className={s.s}>&quot;order book bid-heavy&quot;</span>
                {"\n"}
                {"  "}]{"\n"}
                {"}"}
              </pre>
            </div>
            <div className={s.term}>
              <div className={s.termBar}>
                <span>dawn strategy logs echo-demo</span>
                <span>paper</span>
              </div>
              <pre>
                <span className={s.c}>
                  {"# structured JSON logs, one event per line\n"}
                </span>
                {"{"}
                <span className={s.k}>&quot;event&quot;</span>:{" "}
                <span className={s.s}>&quot;portfolio&quot;</span>,{" "}
                <span className={s.k}>&quot;budget_left&quot;</span>: 50.0
                {"}\n"}
                {"{"}
                <span className={s.k}>&quot;event&quot;</span>:{" "}
                <span className={s.s}>&quot;signal&quot;</span>,{" "}
                <span className={s.k}>&quot;direction&quot;</span>:{" "}
                <span className={s.s}>&quot;buy&quot;</span>,{" "}
                <span className={s.k}>&quot;confidence&quot;</span>: 0.72{"}\n"}
                {"{"}
                <span className={s.k}>&quot;event&quot;</span>:{" "}
                <span className={s.s}>&quot;simulate&quot;</span>,{" "}
                <span className={s.k}>&quot;usd&quot;</span>: 5,{" "}
                <span className={s.k}>&quot;impact&quot;</span>: 0.004{"}\n"}
                {"{"}
                <span className={s.k}>&quot;event&quot;</span>:{" "}
                <span className={s.s}>&quot;buy&quot;</span>,{" "}
                <span className={s.k}>&quot;usd&quot;</span>: 5,{" "}
                <span className={s.k}>&quot;mode&quot;</span>:{" "}
                <span className={s.s}>&quot;paper&quot;</span>
                {"}"}
              </pre>
            </div>
          </div>
        </section>

        {/* API */}
        <section id="api" className={s.section}>
          <p className={s.kicker}>For agents without the plugin</p>
          <h2 className={s.h2}>Four endpoints. Standard x402.</h2>
          <p className={s.sub}>
            The same routes answer any x402 client, including PayBox’s{" "}
            <code className={s.code}>use_service</code>.
          </p>
          <div className={s.api}>
            {endpoints.map(([m, p, c, d]) => (
              <div key={p} className={s.apiRow}>
                <span className={s.method}>{m}</span>
                <span className={s.path}>
                  {p}
                  <small>{d}</small>
                </span>
                <span
                  className={`${s.cost} ${c.includes("USDC") ? s.costPaid : ""}`}
                >
                  {c}
                </span>
              </div>
            ))}
          </div>
          <pre
            className={s.pre}
          >{`curl -i ${BASE}/api/brief/<polymarket-slug>\n# → HTTP 402 Payment Required + x402 payment requirements`}</pre>
          <pre
            className={s.pre}
          >{`# Or paste this into your agent:\nRead ${BASE}/api/templates. Using my PayBox wallet, buy me a brief on <market>, then the signal-follow template for it. Save the python to a file and tell me the dawn command to launch it in paper mode.`}</pre>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${s.section} ${s.faqGrid}`}>
          <div>
            <p className={s.kicker}>FAQ</p>
            <h2 className={s.h2}>Questions, answered plainly.</h2>
            <p className={s.sub}>
              EchoMarkets never holds funds or keys.
              <br />
              Signals are not financial advice.
            </p>
          </div>
          <div className={s.faq}>
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* Closing CTA */}
      <section className={s.closing}>
        <div className={s.giant} aria-hidden>
          ECHO
        </div>
        <div className={`${s.wrap} ${s.closingInner}`}>
          <p className={s.kicker}>Ready when your agent is</p>
          <h2 className={s.h2}>
            Give your agent prediction-market answers it can act on.
          </h2>
          <div className={s.ctas}>
            <a href="#api" className={`${s.btn} ${s.btnGold}`}>
              Use the x402 API →
            </a>
            <a
              href={PAYBOX_PLUGINS}
              className={`${s.btn} ${s.btnGhost}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enable in PayBox · pending review
            </a>
          </div>
        </div>
      </section>

      <div className={s.wrap}>
        <footer className={s.footer}>
          <span>
            Built with love for{" "}
            <a
              href="https://developer.paybox.sh/"
              target="_blank"
              rel="noopener noreferrer"
              className={s.credit}
            >
              MoonPay Hackathons - Chapter 1
            </a>{" "}
            from sunny Malta by{" "}
            <a
              href="https://www.ivanmolto.com"
              target="_blank"
              rel="noopener noreferrer"
              className={s.credit}
            >
              Ivan Molto
            </a>
          </span>
          <nav>
            <a href={DEMO_VIDEO} target="_blank" rel="noopener noreferrer">
              Demo video
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="EchoMarkets on GitHub"
              className={s.iconLink}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
            <a
              href={X_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="EchoMarkets on X"
              className={s.iconLink}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
              </svg>
            </a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

function HeroMock() {
  return (
    <div
      className={s.mock}
      role="img"
      aria-label="Illustration: an agent asks for a brief, PayBox asks to approve 0.02 USDC, and the brief appears in chat"
    >
      <div className={s.mockBar}>
        <i />
        <i />
        <i />
        <span>Agent chat · PayBox connected</span>
      </div>
      <div className={s.mockBody}>
        <div className={s.bubbleUser}>
          Get me the full brief on the December Fed decision.
        </div>
        <div className={s.toolChip}>use_plugin · echomarkets · buy_brief</div>

        <div className={s.approve}>
          <span className={s.approveLabel}>PayBox · approve payment</span>
          <span className={s.approveAmt}>0.02 USDC</span>
          <span className={s.approveMeta}>
            x402 · Solana · to echomarkets.xyz
          </span>
          <span className={s.approveBtn}>Approve</span>
        </div>

        <div className={s.brief}>
          <div className={s.briefHead}>
            <span className={s.briefTitle}>Fed cuts rates in December?</span>
            <span className={`${s.mono} ${s.muted}`}>brief</span>
          </div>
          <div className={s.odds}>
            <div className={s.oddsYes} style={{ width: "62%" }} />
            <div className={s.oddsNo} style={{ width: "38%" }} />
          </div>
          <div className={s.oddsLegend}>
            <span style={{ color: "var(--yes)" }}>YES 0.62</span>
            <span style={{ color: "var(--no)" }}>NO 0.38</span>
          </div>
          <div className={s.kv}>
            <div>
              <b>1.0¢</b>
              <small>spread</small>
            </div>
            <div>
              <b>$184k</b>
              <small>liquidity</small>
            </div>
            <div>
              <b>+4.1%</b>
              <small>24h move</small>
            </div>
          </div>
          <div className={s.signalRow}>
            <span className={s.muted}>Signal (heuristic)</span>
            <span className={s.badge}>buy · 0.72</span>
          </div>
        </div>
      </div>
      <div className={s.caption}>Illustrative example</div>
    </div>
  );
}
