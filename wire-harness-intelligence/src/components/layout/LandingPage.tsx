import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import { useStore } from '../../store/useStore';
import heroImg from '../../assets/hero.png';

export const LandingPage: React.FC = () => {
  const setAppState = useStore((state) => state.setAppState);

  const loaderRef      = useRef<HTMLDivElement>(null);
  const counterRef     = useRef<HTMLDivElement>(null);
  const barRef         = useRef<HTMLDivElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef     = useRef<HTMLParagraphElement>(null);
  const heroCtasRef    = useRef<HTMLDivElement>(null);
  const cursorRef      = useRef<HTMLDivElement>(null);
  const trailRef       = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState(false);

  /* ── 1. Loader + hero entrance ── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (!gsap) {
      // Fallback if GSAP not yet loaded: just skip loader
      setLoaded(true);
      return;
    }

    const counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: 100,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (counterRef.current)
          counterRef.current.textContent = String(Math.floor(counterObj.val)).padStart(3, '0');
        if (barRef.current)
          barRef.current.style.width = `${counterObj.val}%`;
      },
    });

    gsap.to(counterRef.current, { opacity: 0, duration: 0.3, delay: 2.3 });

    gsap.to(loaderRef.current, {
      x: '-100%',
      duration: 1.0,
      ease: 'expo.inOut',
      delay: 2.5,
      onComplete: () => setLoaded(true),
    });

    // Hero heading cuboid roll
    const letters = heroHeadingRef.current?.querySelectorAll('.hero-letter');
    if (letters?.length) {
      gsap.fromTo(
        Array.from(letters),
        { y: '110%', rotateX: -90, transformOrigin: '50% 100%' },
        { y: '0%', rotateX: 0, duration: 0.7, ease: 'back.out(1.2)', stagger: { each: 0.06 }, delay: 3.3 }
      );
    }

    gsap.to(heroSubRef.current,  { opacity: 1, y: 0, duration: 0.8, delay: 3.8 });
    gsap.to(heroCtasRef.current, { opacity: 1, y: 0, duration: 0.8, delay: 4.0 });
  }, []);

  /* ── 2. Custom cursor ── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (!gsap) return;

    const move = (e: MouseEvent) => {
      gsap.to(cursorRef.current,  { x: e.clientX, y: e.clientY, duration: 0.1,  ease: 'power2.out',  overwrite: true });
      gsap.to(trailRef.current,   { x: e.clientX, y: e.clientY, duration: 0.7,  ease: 'power3.out',  overwrite: true });
    };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, []);

  /* ── 3. Bento IntersectionObserver ── */
  useEffect(() => {
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.35) {
            const card = entry.target as HTMLElement;
            card.classList.add('card-visible');
            card.querySelectorAll('.card-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('text-in'), i * 120);
            });
            ob.unobserve(card);
          }
        });
      },
      { threshold: 0.35 }
    );
    document.querySelectorAll('.bento-card').forEach((c) => ob.observe(c));
    return () => ob.disconnect();
  }, [loaded]);

  /* ── 4. Parallax team ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      document.querySelectorAll<HTMLElement>('.team-row-1').forEach((el) => {
        el.style.transform = `translateY(${y * 0.025}px)`;
      });
      document.querySelectorAll<HTMLElement>('.team-row-2').forEach((el) => {
        el.style.transform = `translateY(${y * 0.045}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headingText = 'Legacy to Logic';

  return (
    <div className={`landing-page-root ${loaded ? 'landing-scrollable' : ''}`}>

      {/* ── Custom cursor ── */}
      <div className="cursor-trail" ref={trailRef} />
      <div className="custom-cursor"  ref={cursorRef} />

      {/* ── Loader ── */}
      <div className="loader-panel" ref={loaderRef}>
        <div className="loader-bar"     ref={barRef} />
        <div className="loader-counter" ref={counterRef}>000</div>
      </div>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section className="landing-hero">
        <div className="float-asset asset-1" />
        <div className="float-asset asset-2" />
        <div className="float-asset asset-3" />

        <div className="hero-content">
          <div className="hero-eyebrow">◇ AI Wire Scanner</div>

          <h1
            className="hero-heading"
            aria-label={headingText}
            ref={heroHeadingRef}
          >
            {headingText.split(' ').map((word, wIdx) => (
              <React.Fragment key={wIdx}>
                {word.split('').map((letter, lIdx) => (
                  <div key={lIdx} className="letter-wrap">
                    <span className="hero-letter">{letter}</span>
                  </div>
                ))}
                {wIdx < headingText.split(' ').length - 1 && (
                  <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
                )}
              </React.Fragment>
            ))}
          </h1>

          <p className="hero-sub" ref={heroSubRef}>
            Stop manually transcribing blueprints. <br />
            Upload once. Extract everything.
          </p>

          <div className="hero-ctas" ref={heroCtasRef}>
            <button
              className="lp-btn-primary"
              onClick={() => setAppState('upload')}
            >
              Launch Extraction Tool
            </button>
            <button
              className="lp-btn-ghost"
              onClick={() => document.getElementById('bento')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works ↓
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          BENTO GRID
      ══════════════════════════════ */}
      <section className="bento-section" id="bento">
        <div className="bento-grid">

          {/* 01 — Wide highlight */}
          <div className="bento-card bento-card-wide highlight">
            <div className="bento-number">01</div>
            <h3 className="bento-title card-reveal from-bottom">Instant Netlist Extraction</h3>
            <p  className="bento-body  card-reveal from-bottom">
              Convert dense 2D wire harness diagrams into structured digital netlists in
              milliseconds using advanced OCR and geometric parsing.
            </p>
            <svg viewBox="0 0 100 100" className="card-art">
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="22" />
              <circle cx="50" cy="50" r="36" />
              <circle cx="50" cy="50" r="48" />
            </svg>
          </div>

          {/* 02 — Tall */}
          <div className="bento-card bento-card-tall">
            <div className="bento-number">02</div>
            <h3 className="bento-title card-reveal from-left">Neural Parsing Engine</h3>
            <p  className="bento-body  card-reveal from-left">
              Graph-based algorithms untangle connector routing, splice junctions, and
              overlapping wire loops with 99.8% precision.
            </p>
            <svg viewBox="0 0 100 100" className="card-art">
              <circle cx="20" cy="50" r="5"/><circle cx="50" cy="20" r="5"/>
              <circle cx="80" cy="50" r="5"/><circle cx="50" cy="80" r="5"/>
              <circle cx="50" cy="50" r="5"/>
              <line x1="20" y1="50" x2="50" y2="50"/>
              <line x1="50" y1="20" x2="50" y2="50"/>
              <line x1="80" y1="50" x2="50" y2="50"/>
              <line x1="50" y1="80" x2="50" y2="50"/>
            </svg>
          </div>

          {/* 03 — Small */}
          <div className="bento-card bento-card-sm">
            <div className="bento-number">03</div>
            <h3 className="bento-title card-reveal from-right">3D Digital Twins</h3>
            <p  className="bento-body  card-reveal from-right">Auto-generate GLB models from 2D logic.</p>
            <svg viewBox="0 0 100 100" className="card-art">
              <rect x="20" y="30" width="45" height="45" fill="none" stroke="currentColor"/>
              <rect x="35" y="15" width="45" height="45" fill="none" stroke="currentColor"/>
              <line x1="20" y1="30" x2="35" y2="15" stroke="currentColor"/>
              <line x1="65" y1="30" x2="80" y2="15" stroke="currentColor"/>
              <line x1="20" y1="75" x2="35" y2="60" stroke="currentColor"/>
              <line x1="65" y1="75" x2="80" y2="60" stroke="currentColor"/>
            </svg>
          </div>

          {/* Hero image — full width */}
          <div className="bento-card" style={{ gridColumn: 'span 12', padding: 0 }}>
            <img
              className="card-reveal from-left"
              src={heroImg}
              alt="Wire harness schematic"
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                       filter: 'grayscale(100%) contrast(1.2)' }}
            />
          </div>

          {/* 04 — Med */}
          <div className="bento-card bento-card-med">
            <div className="bento-number">04</div>
            <h3 className="bento-title card-reveal from-bottom">Automated Export Pipeline</h3>
            <p  className="bento-body  card-reveal from-bottom">
              Export directly to IPC-D-356, CSV, or your ERP manufacturing pipeline
              with a single click.
            </p>
            <svg viewBox="0 0 100 100" className="card-art">
              <rect x="15" y="20" width="50" height="60" fill="none" stroke="currentColor"/>
              <line x1="70" y1="50" x2="90" y2="50" stroke="currentColor"/>
              <polyline points="82,42 90,50 82,58" fill="none" stroke="currentColor"/>
            </svg>
          </div>

          {/* 05 — Med */}
          <div className="bento-card bento-card-med">
            <div className="bento-number">05</div>
            <h3 className="bento-title card-reveal from-right">Seamless Tooling Integration</h3>
            <p  className="bento-body  card-reveal from-right">
              REST API endpoints let you push schematics and pull generated 3D models
              seamlessly across your tech stack.
            </p>
            <svg viewBox="0 0 100 100" className="card-art">
              <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor"/>
              <line x1="50" y1="25" x2="50" y2="10" stroke="currentColor"/>
              <line x1="50" y1="75" x2="50" y2="90" stroke="currentColor"/>
              <line x1="25" y1="50" x2="10" y2="50" stroke="currentColor"/>
              <line x1="75" y1="50" x2="90" y2="50" stroke="currentColor"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          TEAM / TECH SECTION
      ══════════════════════════════ */}
      <section className="team-section">
        <h2 className="team-section-title">Built for Engineers</h2>
        <div className="team-grid">
          {[
            {
              num: '01', name: 'Robust Architecture', role: 'SYSTEMS', row: 'team-row-1',
              bio: 'Handles massive multipage harness diagrams without memory leaks. Process tens of thousands of connections locally without cloud latency.',
            },
            {
              num: '02', name: 'Zero Configuration', role: 'DEPLOYMENT', row: 'team-row-2',
              bio: 'Runs completely in-browser for sensitive IP, or connects to our on-prem enterprise pipeline for distributed processing clusters.',
            },
            {
              num: '03', name: 'WebXR Ready', role: 'VISUALIZATION', row: 'team-row-1',
              bio: 'View generated 3D harnesses on the manufacturing floor using Meta Quest or HoloLens for guided augmented reality assembly.',
            },
          ].map((item) => (
            <div key={item.num} className={`team-card ${item.row}`}>
              <div className="card-number">{item.num}</div>
              <div className="card-avatar" style={{ background: '#302B23' }} />
              <h4 className="card-name">{item.name}</h4>
              <div className="card-role">{item.role}</div>
              <p className="card-bio">{item.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="lp-footer">
        <h2 className="footer-statement">
          Wire harness <span>logic</span><br />redefined.
        </h2>

        <div className="footer-grid">
          <div>
            <div className="footer-col-label">◇ Product</div>
            <button className="footer-link" onClick={() => setAppState('upload')}>Extraction Tool</button>
            <span className="footer-link">Documentation</span>
            <span className="footer-link">API Setup</span>
            <span className="footer-link">Pricing</span>
          </div>
          <div>
            <div className="footer-col-label">◇ Company</div>
            <span className="footer-link">About Us</span>
            <span className="footer-link">Careers</span>
            <span className="footer-link">Blog</span>
          </div>
          <div>
            <div className="footer-col-label">◇ Status</div>
            <p className="footer-status">
              All systems operational.<br />
              v2.14.0 — Neural update deployed.<br />
              Server latency: 14ms
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Aether Systems Inc.</span>
          <span>INDUSTRIAL GRADE DESIGN</span>
        </div>
      </footer>

    </div>
  );
};
