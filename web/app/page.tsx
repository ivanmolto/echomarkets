// app/page.tsx — EchoMarkets landing (static, dark + gold)
// Leads with the request you'd type to your agent (pattern from paybox.sh); layout rhythm
// (product mockup hero, built-on row, stats band, numbered steps, FAQ, closing CTA) from areta.market.

import Link from 'next/link'
import s from './page.module.css'

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.echomarkets.xyz'
const X_POST = process.env.NEXT_PUBLIC_X_POST ?? '' // set after the demo video is posted
const REPO = 'https://github.com/ivanmolto/echomarkets'
const PAYBOX_PLUGINS = 'https://app.paybox.sh/plugins'

const builtOn: [string, string][] = [
  ['PayBox', 'https://paybox.sh'],
  ['Dawn', 'https://cli.dawn.ai'],
  ['Polymarket', 'https://polymarket.com'],
  ['Solana', 'https://solana.com'],
  ['x402', 'https://x402.org'],
]

const asks = [
  {
    say: '“Find me a market on the next Fed decision and preview it.”',
    cost: 'free',
    gets: 'Live odds, bid/ask spread, liquidity and resolution date — straight from Polymarket, no payment.',
    tool: 'search_markets · brief_preview',
  },
  {
    say: '“Get me the full brief.”',
    cost: '0.02 USDC',
    gets: 'Order-book depth, 24h movement, resolution criteria and risk notes. PayBox shows the payment; you approve; the brief lands in chat.',
    tool: 'buy_brief → x402',
  },
  {
    say: '“Buy the signal-follow template for this market.”',
    cost: '0.10 USDC',
    gets: 'A ready-to-run Dawn strategy personalised to the market, with 24 hours of EchoMarkets signal access embedded. Paper mode by default.',
    tool: 'buy_template → x402',
  },
]

const stats = [
  { pre: 'per brief', num: '2¢', label: 'Odds, depth, movement and resolution for one market.' },
  { pre: 'per strategy', num: '10¢', label: 'A runnable Dawn file plus 24h of signal access.' },
  { pre: 'accounts · API keys', num: '0', label: 'The x402 payment is the credential.' },
  { pre: 'from', num: 'Ask → Run', label: 'One conversation, from question to paper strategy.' },
]

const steps = [
  { title: 'Enable the plugin', text: 'In PayBox, open Plugins and switch on EchoMarkets.' },
  { title: 'Ask your agent', text: 'Search and preview are free. Claude, ChatGPT or any PayBox-connected agent.' },
  { title: 'Approve in PayBox', text: 'Every paid call is an x402 proposal you see first: 2¢ or 10¢ in USDC on Solana.' },
  { title: 'Get the brief or file', text: 'The paid response lands in chat. Templates arrive personalised to the market.' },
  { title: 'Launch in Dawn', text: 'dawn strategy launch file.py — paper mode, polling the signal with its 24h token.' },
]

const endpoints: [string, string, string, string][] = [
  ['GET', '/api/brief/{market}', '0.02 USDC · x402', 'Full brief for one market'],
  ['POST', '/api/templates/{slug}', '0.10 USDC · x402', 'Personalised Dawn strategy + 24h signal token'],
  ['GET', '/api/signal/{market}', 'bearer token', 'Direction · confidence · reasoning — polled by the strategy'],
  ['GET', '/api/templates', 'free', 'What is for sale and how to buy it'],
]

const faqs = [
  {
    q: 'Does EchoMarkets hold my funds or keys?',
    a: 'No. EchoMarkets only proposes payments. PayBox shows each x402 proposal to you, you approve it, and PayBox pays from your own wallet. Dawn trades from your own wallet too.',
  },
  {
    q: 'How is the signal computed?',
    a: 'From live Polymarket order books: spread, liquidity, price band and bid/ask balance. Each response returns a direction, a confidence score and the reasons behind it, so your agent or strategy can decide how much weight to give it.',
  },
  {
    q: 'How does EchoMarkets fit with Dawn?',
    a: 'EchoMarkets supplies what Dawn strategies act on. You don’t need Dawn to start — briefs work in any PayBox-connected agent, with no account or terminal. When you want it to run on its own, the template turns a brief into a ready-to-run Dawn strategy with 24 hours of signal access.',
  },
  {
    q: 'What chain and token do I pay with?',
    a: 'USDC on Solana mainnet, through PayBox. Prices are fixed per call: 0.02 USDC for a brief, 0.10 USDC for a template.',
  },
  {
    q: 'Can I use it without the PayBox plugin?',
    a: 'Yes. The same endpoints answer any x402 client, including PayBox’s use_service. Request a paid route without payment and you get a standard 402 with the payment requirements.',
  },
]

export default function Home() {
  return (
    <main className={s.page}>
      <div className={s.announce}>
        Built for MoonPay Hackathons · Chapter 1 —{' '}
        {X_POST
          ? <a href={X_POST} target="_blank" rel="noopener noreferrer">Watch the demo on X →</a>
          : <a href="#how">See how it works →</a>}
      </div>

      <div className={s.wrap}>
        <header className={s.header}>
          <Link href="/" className={s.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={32} height={32} />
            <span>ECHO<span className={s.gold}>MARKETS</span></span>
          </Link>
          <nav className={s.nav}>
            <a href="#how">How it works</a>
            <a href="#api">API</a>
            <a href="#faq">FAQ</a>
            <a href={PAYBOX_PLUGINS} className={`${s.btn} ${s.btnGold} ${s.btnSmall}`}>Enable in PayBox</a>
          </nav>
        </header>

        {/* Hero */}
        <section className={s.hero}>
          <div className={s.glow} aria-hidden />
          <div className={s.heroCopy}>
            <span className={s.eyebrow}><span className={s.dot} /> Consumed in PayBox · Executable in Dawn</span>
            <h1 className={s.h1}>
              Now your agent can <span className={s.goldText}>buy signals at scale.</span>
            </h1>
            <p className={s.lede}>
              Prediction-market intelligence for AI agents, sold a few cents at a time over x402. No accounts, no API keys — the payment is the credential.
            </p>
            <div className={s.ctas}>
              <a href={PAYBOX_PLUGINS} className={`${s.btn} ${s.btnGold}`}>Enable in PayBox →</a>
              <a href="#api" className={`${s.btn} ${s.btnGhost}`}>Use the x402 API</a>
            </div>
            <div className={s.pills}>
              <span className={s.pill}><span className={s.dot} />Polymarket data</span>
              <span className={s.pill}><span className={s.dot} />USDC on Solana</span>
              <span className={s.pill}><span className={s.dot} />Dawn strategies</span>
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
            <a key={name} href={href} className={s.wordmark} target="_blank" rel="noopener noreferrer">{name}</a>
          ))}
        </div>
      </div>

      <div className={s.wrap}>
        {/* Three asks */}
        <section id="how" className={s.section}>
          <p className={s.kicker}>Three sentences</p>
          <h2 className={s.h2}>Say it to your agent. PayBox handles the money.</h2>
          <p className={s.sub}>Start free, pay only when you want depth, and leave with a strategy you can run.</p>
          <div className={s.asks}>
            {asks.map((a, i) => (
              <article key={a.say} className={s.ask}>
                <div className={s.askTop}>
                  <span className={s.askNum}>0{i + 1}</span>
                  <span className={`${s.price} ${a.cost !== 'free' ? s.pricePaid : ''}`}>{a.cost}</span>
                </div>
                <p className={s.askSay}>{a.say}</p>
                <p className={s.askGets}>{a.gets}</p>
                <p className={s.askTool}>{a.tool}</p>
              </article>
            ))}
          </div>

          <div className={s.stats}>
            {stats.map(st => (
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
            <h2 className={s.h2}>Empowering the money legos in MoonPay’s agent stack.</h2>
            <p className={s.sub}>
              PayBox is the wallet. Dawn is the trading engine. EchoMarkets is the intelligence piece that snaps between them — bought per request over x402, delivered as a brief or a ready-to-run Dawn strategy.
            </p>
          </div>
          <blockquote className={s.quote}>
            <span className={s.quoteMark} aria-hidden>“</span>
            <p className={s.quoteText}>
              PayBox pays. Dawn trades. <span className={s.goldText}>EchoMarkets decides.</span> Snap them together.
            </p>
            <p className={s.quoteBy}>EchoMarkets</p>
          </blockquote>
        </section>

        {/* Steps */}
        <section className={s.section}>
          <p className={s.kicker}>How it works</p>
          <h2 className={s.h2}>From question to paper strategy in five steps.</h2>
          <ol className={s.steps}>
            {steps.map((st, i) => (
              <li key={st.title} className={s.step}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                <p className={s.stepTitle}>{st.title}</p>
                <p className={s.stepText}>{st.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Inside the strategy */}
        <section className={s.section}>
          <p className={s.kicker}>Inside the strategy</p>
          <h2 className={s.h2}>The signal is plain JSON. The strategy is plain Python.</h2>
          <p className={s.sub}>
            The template polls <code className={s.code}>/api/signal</code> with its 24h token, simulates before it buys, gates on price impact and respects your Dawn budget.
          </p>
          <div className={s.duo}>
            <div className={s.term}>
              <div className={s.termBar}><span>GET /api/signal/{'{market}'}</span><span>200</span></div>
              <pre>
{'{\n'}
{'  '}<span className={s.k}>&quot;direction&quot;</span>: <span className={s.s}>&quot;buy&quot;</span>,{'\n'}
{'  '}<span className={s.k}>&quot;confidence&quot;</span>: 0.72,{'\n'}
{'  '}<span className={s.k}>&quot;reasoning&quot;</span>: [{'\n'}
{'    '}<span className={s.s}>&quot;tight spread 1.0¢&quot;</span>,{'\n'}
{'    '}<span className={s.s}>&quot;liquidity $184,220&quot;</span>,{'\n'}
{'    '}<span className={s.s}>&quot;order book bid-heavy&quot;</span>{'\n'}
{'  '}]{'\n'}
{'}'}
              </pre>
            </div>
            <div className={s.term}>
              <div className={s.termBar}><span>dawn strategy logs echo-demo</span><span>paper</span></div>
              <pre>
<span className={s.c}>{'# structured JSON logs, one event per line\n'}</span>
{'{'}<span className={s.k}>&quot;event&quot;</span>: <span className={s.s}>&quot;portfolio&quot;</span>, <span className={s.k}>&quot;budget_left&quot;</span>: 50.0{'}\n'}
{'{'}<span className={s.k}>&quot;event&quot;</span>: <span className={s.s}>&quot;signal&quot;</span>, <span className={s.k}>&quot;direction&quot;</span>: <span className={s.s}>&quot;buy&quot;</span>, <span className={s.k}>&quot;confidence&quot;</span>: 0.72{'}\n'}
{'{'}<span className={s.k}>&quot;event&quot;</span>: <span className={s.s}>&quot;simulate&quot;</span>, <span className={s.k}>&quot;usd&quot;</span>: 5, <span className={s.k}>&quot;impact&quot;</span>: 0.004{'}\n'}
{'{'}<span className={s.k}>&quot;event&quot;</span>: <span className={s.s}>&quot;buy&quot;</span>, <span className={s.k}>&quot;usd&quot;</span>: 5, <span className={s.k}>&quot;mode&quot;</span>: <span className={s.s}>&quot;paper&quot;</span>{'}'}
              </pre>
            </div>
          </div>
        </section>

        {/* API */}
        <section id="api" className={s.section}>
          <p className={s.kicker}>For agents without the plugin</p>
          <h2 className={s.h2}>Four endpoints. Standard x402.</h2>
          <p className={s.sub}>
            The same routes answer any x402 client, including PayBox’s <code className={s.code}>use_service</code>.
          </p>
          <div className={s.api}>
            {endpoints.map(([m, p, c, d]) => (
              <div key={p} className={s.apiRow}>
                <span className={s.method}>{m}</span>
                <span className={s.path}>{p}<small>{d}</small></span>
                <span className={`${s.cost} ${c.includes('USDC') ? s.costPaid : ''}`}>{c}</span>
              </div>
            ))}
          </div>
          <pre className={s.pre}>{`curl -i ${BASE}/api/brief/<polymarket-slug>\n# → HTTP 402 Payment Required + x402 payment requirements`}</pre>
          <pre className={s.pre}>{`# Or paste this into your agent:\nRead ${BASE}/api/templates. Using my PayBox wallet, buy me a brief on <market>, then the signal-follow template for it. Save the python to a file and tell me the dawn command to launch it in paper mode.`}</pre>
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
            {faqs.map(f => (
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
        <div className={s.giant} aria-hidden>ECHO</div>
        <div className={`${s.wrap} ${s.closingInner}`}>
          <p className={s.kicker}>Ready when your agent is</p>
          <h2 className={s.h2}>Give your agent prediction-market answers and strategies at scale.</h2>
          <div className={s.ctas}>
            <a href={PAYBOX_PLUGINS} className={`${s.btn} ${s.btnGold}`}>Enable in PayBox →</a>
            <a href="https://cli.dawn.ai" className={`${s.btn} ${s.btnGhost}`}>Get Dawn</a>
          </div>
        </div>
      </section>

      <div className={s.wrap}>
        <footer className={s.footer}>
          <span>
            Built with love for{' '}
            <a href="https://developer.paybox.sh/" target="_blank" rel="noopener noreferrer" className={s.credit}>MoonPay Hackathons - Chapter 1</a>
            {' '}from sunny Malta by{' '}
            <a href="https://www.ivanmolto.com" target="_blank" rel="noopener noreferrer" className={s.credit}>Ivan Molto</a>
          </span>
          <nav>
            {X_POST && <a href={X_POST}>Demo video</a>}
            <a href={REPO}>Source</a>
            <a href="https://paybox.sh">PayBox</a>
            <a href="https://cli.dawn.ai">Dawn</a>
          </nav>
        </footer>
      </div>
    </main>
  )
}

function HeroMock() {
  return (
    <div className={s.mock} role="img" aria-label="Illustration: an agent asks for a brief, PayBox asks to approve 0.02 USDC, and the brief appears in chat">
      <div className={s.mockBar}>
        <i /><i /><i />
        <span>Agent chat · PayBox connected</span>
      </div>
      <div className={s.mockBody}>
        <div className={s.bubbleUser}>Get me the full brief on the December Fed decision.</div>
        <div className={s.toolChip}>use_plugin · echomarkets · buy_brief</div>

        <div className={s.approve}>
          <span className={s.approveLabel}>PayBox · approve payment</span>
          <span className={s.approveAmt}>0.02 USDC</span>
          <span className={s.approveMeta}>x402 · Solana · to echomarkets.xyz</span>
          <span className={s.approveBtn}>Approve</span>
        </div>

        <div className={s.brief}>
          <div className={s.briefHead}>
            <span className={s.briefTitle}>Fed cuts rates in December?</span>
            <span className={`${s.mono} ${s.muted}`}>brief</span>
          </div>
          <div className={s.odds}>
            <div className={s.oddsYes} style={{ width: '62%' }} />
            <div className={s.oddsNo} style={{ width: '38%' }} />
          </div>
          <div className={s.oddsLegend}>
            <span style={{ color: 'var(--yes)' }}>YES 0.62</span>
            <span style={{ color: 'var(--no)' }}>NO 0.38</span>
          </div>
          <div className={s.kv}>
            <div><b>1.0¢</b><small>spread</small></div>
            <div><b>$184k</b><small>liquidity</small></div>
            <div><b>+4.1%</b><small>24h move</small></div>
          </div>
          <div className={s.signalRow}>
            <span className={s.muted}>Signal (heuristic)</span>
            <span className={s.badge}>buy · 0.72</span>
          </div>
        </div>
      </div>
      <div className={s.caption}>Illustrative example</div>
    </div>
  )
}
