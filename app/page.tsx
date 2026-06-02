export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0f0f0f;
          --steel: #1c2b3a;
          --orange: #e85d04;
          --orange-dark: #c44d00;
          --fog: #f5f3ef;
          --muted: #6b7280;
          --border: #d1cdc6;
        }

        body {
          font-family: 'Barlow', sans-serif;
          background: var(--fog);
          color: var(--ink);
          overflow-x: hidden;
        }

        .page { min-height: 100vh; }

        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1.5px solid var(--border);
          background: var(--fog);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -0.5px;
          color: var(--ink);
          text-decoration: none;
        }

        .logo span { color: var(--orange); }

        nav a.cta-sm {
          background: var(--orange);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 10px 22px;
          text-decoration: none;
          border: 2px solid var(--orange);
          transition: background 0.15s, color 0.15s;
        }

        nav a.cta-sm:hover {
          background: var(--orange-dark);
          border-color: var(--orange-dark);
        }

        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 73px);
          border-bottom: 1.5px solid var(--border);
        }

        .hero-left {
          padding: 80px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1.5px solid var(--border);
        }

        .eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 20px;
        }

        h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: clamp(56px, 6vw, 88px);
          line-height: 0.95;
          letter-spacing: -1px;
          color: var(--ink);
          margin-bottom: 28px;
          text-transform: uppercase;
        }

        h1 em {
          font-style: normal;
          color: var(--orange);
        }

        .tagline {
          font-size: 18px;
          color: var(--muted);
          line-height: 1.6;
          max-width: 420px;
          margin-bottom: 44px;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--orange);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 17px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 16px 36px;
          text-decoration: none;
          border: 2px solid var(--orange);
          transition: background 0.15s;
          display: inline-block;
        }

        .btn-primary:hover { background: var(--orange-dark); border-color: var(--orange-dark); }

        .btn-secondary {
          color: var(--ink);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          text-decoration: none;
          border-bottom: 2px solid var(--ink);
          padding-bottom: 2px;
          transition: color 0.15s;
        }

        .btn-secondary:hover { color: var(--orange); border-color: var(--orange); }

        .hero-right {
          background: var(--steel);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 48px;
          position: relative;
          overflow: hidden;
        }

        .hero-right::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 300px; height: 300px;
          border: 40px solid rgba(232,93,4,0.15);
          border-radius: 50%;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          position: relative;
          z-index: 1;
        }

        .stat-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 32px 28px;
        }

        .stat-number {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 42px;
          line-height: 1;
          color: var(--orange);
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ticker {
          background: var(--orange);
          padding: 14px 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .ticker-inner {
          display: inline-flex;
          gap: 48px;
          animation: ticker 20s linear infinite;
        }

        .ticker-item {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #fff;
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1.5px solid var(--border);
        }

        .feature {
          padding: 56px 44px;
          border-right: 1.5px solid var(--border);
        }

        .feature:last-child { border-right: none; }

        .feature-num {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 24px;
        }

        .feature h3 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 26px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 14px;
          line-height: 1.1;
        }

        .feature p { font-size: 15px; color: var(--muted); line-height: 1.65; }

        .pricing {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1.5px solid var(--border);
        }

        .pricing-label {
          padding: 56px 48px;
          border-right: 1.5px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .pricing-label h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: clamp(40px, 4vw, 64px);
          text-transform: uppercase;
          line-height: 1;
          color: var(--ink);
          margin-bottom: 16px;
        }

        .pricing-label p { font-size: 16px; color: var(--muted); max-width: 340px; line-height: 1.6; }

        .pricing-cards { display: grid; grid-template-columns: 1fr 1fr; }

        .price-card {
          padding: 48px 40px;
          border-right: 1.5px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        .price-card:last-child { border-right: none; }
        .price-card.featured { background: var(--steel); color: #fff; }

        .plan-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 20px;
        }

        .price-amount {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 64px;
          line-height: 1;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .price-card.featured .price-amount { color: #fff; }

        .price-period { font-size: 13px; color: var(--muted); margin-bottom: 32px; }
        .price-card.featured .price-period { color: rgba(255,255,255,0.4); }

        .price-features { list-style: none; margin-bottom: 40px; flex: 1; }

        .price-features li {
          font-size: 14px;
          color: var(--muted);
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .price-card.featured .price-features li {
          color: rgba(255,255,255,0.6);
          border-color: rgba(255,255,255,0.08);
        }

        .price-features li::before { content: '—'; color: var(--orange); font-weight: 700; flex-shrink: 0; }

        .btn-plan {
          display: block;
          text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 14px;
          text-decoration: none;
          border: 2px solid var(--border);
          color: var(--ink);
          transition: all 0.15s;
        }

        .btn-plan:hover { border-color: var(--ink); }

        .btn-plan.primary {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
        }

        .btn-plan.primary:hover { background: var(--orange-dark); border-color: var(--orange-dark); }

        footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 48px;
          border-top: 1.5px solid var(--border);
        }

        footer p { font-size: 13px; color: var(--muted); }

        @media (max-width: 768px) {
          nav { padding: 16px 20px; }
          .hero { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: 60px 20px; }
          .features { grid-template-columns: 1fr; }
          .feature { border-right: none; border-bottom: 1.5px solid var(--border); }
          .pricing { grid-template-columns: 1fr; }
          .pricing-label { border-right: none; border-bottom: 1.5px solid var(--border); padding: 40px 20px; }
          .pricing-cards { grid-template-columns: 1fr; }
          .price-card { border-right: none; border-bottom: 1.5px solid var(--border); }
          footer { flex-direction: column; gap: 8px; padding: 24px 20px; }
        }
      `}</style>

      <div className="page">
        <nav>
          <a href="/" className="logo">KUV<span>LO</span></a>
          <a href="/sign-up" className="cta-sm">Start free</a>
        </nav>

        <section className="hero">
          <div className="hero-left">
            <p className="eyebrow">Built for solo contractors</p>
            <h1>Run your<br />trade.<br />Not your<br /><em>paperwork.</em></h1>
            <p className="tagline">From first call to final invoice — simplified. Jobs, clients, and invoices in one place built for the guy in the field, not the guy behind a desk.</p>
            <div className="hero-actions">
              <a href="/sign-up" className="btn-primary">Start free — no card needed</a>
              <a href="#pricing" className="btn-secondary">See pricing</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-number">More</div>
                <div className="stat-label">time on actual work</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">Less</div>
                <div className="stat-label">time on paperwork</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">$39</div>
                <div className="stat-label">per month, all in</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">∞</div>
                <div className="stat-label">clients & jobs on pro</div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker">
          <div className="ticker-inner">
            {[...Array(2)].map((_, i) => (
              <span key={i} style={{ display: 'inline-flex', gap: '48px' }}>
                <span className="ticker-item">Jobs &nbsp;·&nbsp;</span>
                <span className="ticker-item">Clients &nbsp;·&nbsp;</span>
                <span className="ticker-item">Invoices &nbsp;·&nbsp;</span>
                <span className="ticker-item">Payment links &nbsp;·&nbsp;</span>
                <span className="ticker-item">HVAC &nbsp;·&nbsp;</span>
                <span className="ticker-item">Plumbing &nbsp;·&nbsp;</span>
                <span className="ticker-item">Electrical &nbsp;·&nbsp;</span>
                <span className="ticker-item">Landscaping &nbsp;·&nbsp;</span>
                <span className="ticker-item">Handyman &nbsp;·&nbsp;</span>
                <span className="ticker-item">Pest Control &nbsp;·&nbsp;</span>
              </span>
            ))}
          </div>
        </div>

        <section className="features">
          <div className="feature">
            <p className="feature-num">01</p>
            <h3>Schedule & track jobs</h3>
            <p>Add a job in seconds. Track status from scheduled to completed. Know exactly what's on your plate every morning without digging through texts.</p>
          </div>
          <div className="feature">
            <p className="feature-num">02</p>
            <h3>Invoice like a pro</h3>
            <p>Generate a clean, professional invoice in under a minute. Send it by email with a payment link attached. Get paid faster without the back-and-forth.</p>
          </div>
          <div className="feature">
            <p className="feature-num">03</p>
            <h3>Know your numbers</h3>
            <p>See what you've earned, what's pending, and which clients owe you money — all on one screen. No spreadsheets. No guessing.</p>
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="pricing-label">
            <h2>Simple,<br />honest<br />pricing.</h2>
            <p>No contracts. No hidden fees. Cancel any time. If it doesn't save you more than it costs, you shouldn't pay for it.</p>
          </div>
          <div className="pricing-cards">
            <div className="price-card">
              <p className="plan-name">Free</p>
              <div className="price-amount">$0</div>
              <p className="price-period">forever</p>
              <ul className="price-features">
                <li>Up to 5 clients</li>
                <li>Job scheduling</li>
                <li>Basic invoicing</li>
                <li>Mobile friendly</li>
              </ul>
              <a href="/sign-up" className="btn-plan">Get started</a>
            </div>
            <div className="price-card featured">
              <p className="plan-name">Pro</p>
              <div className="price-amount">$39</div>
              <p className="price-period">per month</p>
              <ul className="price-features">
                <li>Unlimited clients</li>
                <li>Unlimited jobs</li>
                <li>PDF invoice generation</li>
                <li>Email invoices to clients</li>
                <li>Payment links</li>
                <li>Revenue dashboard</li>
              </ul>
              <a href="/sign-up" className="btn-plan primary">Start free trial</a>
            </div>
          </div>
        </section>

        <footer>
          <p>© 2026 Kuvlo. Built for the trades.</p>
          <p>kuvlo.io</p>
        </footer>
      </div>
    </>
  )
}