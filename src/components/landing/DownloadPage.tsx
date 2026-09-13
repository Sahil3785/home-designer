import React, { useEffect, useRef } from 'react';
import {
  Apple,
  Monitor,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HardDrive,
  Home,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  getClientOS,
  GITHUB_RELEASES_URL,
  DIRECT_MAC_DMG_DOWNLOAD,
  DIRECT_WIN_EXE_DOWNLOAD,
} from '../../core/platform';

interface DownloadPageProps {
  onBackToHome: () => void;
}

const VERSION = '1.0.0';

/** decorative blueprint corner used on the platform sheets */
const SheetGrid: React.FC<{ tint: string }> = ({ tint }) => {
  const id = `g-${tint.replace('#', '')}`;
  return (
    <svg className="dl-sheetart" viewBox="0 0 520 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0 L0 0 0 16" fill="none" stroke="rgba(127,199,232,.22)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="520" height="150" fill={`url(#${id})`} />

      <line x1="30" y1="14" x2="370" y2="14" stroke="#E0A42B" strokeWidth="1.2" />
      <line x1="30" y1="9" x2="30" y2="19" stroke="#E0A42B" strokeWidth="1.6" />
      <line x1="370" y1="9" x2="370" y2="19" stroke="#E0A42B" strokeWidth="1.6" />

      {([
        [30, 28, 130, 56], [160, 28, 100, 56], [260, 28, 110, 56],
        [30, 84, 200, 44], [230, 84, 140, 44],
      ] as Array<[number, number, number, number]>).map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h}
          fill={i === 1 ? `${tint}3D` : 'rgba(127,199,232,.10)'}
          stroke="#DCEBFA" strokeWidth="2.4" />
      ))}
    </svg>
  );
};

export const DownloadPage: React.FC<DownloadPageProps> = ({ onBackToHome }) => {
  const currentOS = getClientOS();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = root.current?.querySelectorAll('[data-reveal]');
    if (!els || !('IntersectionObserver' in window)) {
      els?.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const platforms = [
    {
      id: 'mac' as const,
      name: 'macOS',
      chips: 'Apple silicon and Intel',
      icon: <Apple size={24} />,
      tint: '#2B6BE4',
      href: DIRECT_MAC_DMG_DOWNLOAD,
      file: `HomeDesigner_${VERSION}_aarch64.dmg`,
      label: 'Download the .dmg',
      specs: [
        ['Format', 'Universal DMG, arm64 and x64'],
        ['Size', 'About 8.8 MB'],
        ['Needs', 'macOS 11 Big Sur or newer'],
      ],
      install: 'Open the DMG, then drag Home Designer into Applications.',
    },
    {
      id: 'windows' as const,
      name: 'Windows',
      chips: '64-bit Windows 10 and 11',
      icon: <Monitor size={24} />,
      tint: '#17916B',
      href: DIRECT_WIN_EXE_DOWNLOAD,
      file: `HomeDesigner_${VERSION}_x64-setup.exe`,
      label: 'Download the installer',
      specs: [
        ['Format', 'MSI and EXE setup'],
        ['Size', 'About 10 MB'],
        ['Needs', 'Windows 10 64-bit or newer'],
      ],
      install: 'Run the setup wizard, then launch from the Start menu.',
    },
  ];

  const steps = [
    { t: 'Download the file', d: 'Pick your platform above. The installer is small enough to finish on a slow connection.' },
    { t: 'Install it', d: 'macOS: drag the app into Applications. Windows: run the setup wizard and accept the default location.' },
    { t: 'Open it and draw', d: 'No account, no licence key. The app opens straight into a blank drawing sheet in feet and inches.' },
  ];

  return (
    <div className="hd-page dl-page" ref={root}>
      <style>{CSS}</style>

      <header className="hd-nav">
        <button onClick={onBackToHome} className="dl-back">
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </button>

        <a className="hd-brand" href="#top" onClick={(e) => { e.preventDefault(); onBackToHome(); }}>
          <span className="hd-mark"><Home size={17} /></span>
          <span className="hd-brand-name">Home Designer</span>
          <span className="hd-pro">Pro</span>
        </a>

        <a className="dl-gh" href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer">
          <span>All releases</span>
          <ExternalLink size={13} />
        </a>
      </header>

      {/* ───────────────────────── hero ───────────────────────── */}
      <section className="dl-hero" id="top">
        <div className="dl-hero-glow" aria-hidden="true" />
        <div className="hd-wrap dl-hero-inner">
          <span className="hd-chip">
            <ShieldCheck size={13} />
            Stable release {VERSION}
          </span>
          <h1 className="hd-h1 dl-h1">Get Home Designer Pro</h1>
          <p className="hd-lede dl-lede">
            One file, one install, nothing to sign up for. The app runs entirely on your computer
            and keeps every drawing as a file on your own disk.
          </p>

          <div className="dl-badges">
            <span><HardDrive size={14} /> Around 10 MB</span>
            <span><Globe size={14} /> Works offline</span>
            <span><Zap size={14} /> GPU-accelerated 3D</span>
          </div>
        </div>
      </section>

      {/* ─────────────────── platform sheets ──────────────────── */}
      <section className="hd-sec dl-sec-platforms">
        <div className="hd-wrap">
          <div className="dl-grid">
            {platforms.map((p) => {
              const detected = currentOS === p.id;
              return (
                <article key={p.id} className={`dl-card${detected ? ' is-detected' : ''}`} data-reveal>
                  {detected && <span className="dl-detected">Detected on this computer</span>}

                  <div className="dl-card-art">
                    <SheetGrid tint={p.tint} />
                    <span className="dl-os-icon" style={{ background: p.id === 'mac' ? '#0C1B33' : '#0B6FA4' }}>
                      {p.icon}
                    </span>
                  </div>

                  <div className="dl-card-body">
                    <h2>{p.name}</h2>
                    <p className="dl-card-sub">{p.chips}</p>

                    <dl className="dl-specs">
                      {p.specs.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <a href={p.href} download={p.file} className={`hd-btn hd-btn-lg ${detected ? 'hd-btn-primary' : 'hd-btn-dark'} dl-dl`}>
                      <Download size={17} />
                      <span>{p.label}</span>
                    </a>
                    <p className="dl-file">{p.file}</p>
                    <p className="dl-hint"><CheckCircle2 size={14} /> {p.install}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────── install steps ──────────────────── */}
      <section className="hd-sec dl-sec-steps">
        <div className="hd-wrap">
          <div className="hd-sec-head" data-reveal>
            <h2 className="hd-h2">Three steps to your first drawing</h2>
            <p>The whole thing takes about a minute on a normal connection.</p>
          </div>
          <ol className="dl-steps">
            {steps.map((s, i) => (
              <li key={s.t} data-reveal>
                <span className="dl-step-n">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────── what you get band ────────────────── */}
      <section className="hd-sec dl-sec-dark">
        <div className="hd-wrap dl-promise">
          <div data-reveal>
            <h2 className="hd-h2 hd-h2-invert">Everything stays on your machine</h2>
            <p className="hd-invert-p">
              There is no server between you and your drawings. That means no upload wait, no account
              to lose access to, and no reason the app should stop working if a service goes away.
            </p>
          </div>
          <ul className="dl-promise-list" data-reveal>
            <li>
              <span className="hd-icon hd-icon-blue"><Globe size={19} /></span>
              <div><strong>No internet needed</strong><em>Draw on a flight, on site, or on a laptop that has never been online.</em></div>
            </li>
            <li>
              <span className="hd-icon hd-icon-green"><HardDrive size={19} /></span>
              <div><strong>Your files, your folders</strong><em>Plans save where you choose. Back them up the way you back up anything else.</em></div>
            </li>
            <li>
              <span className="hd-icon hd-icon-amber"><Zap size={19} /></span>
              <div><strong>Rendered by your own GPU</strong><em>The 3D view uses the graphics hardware already in your computer.</em></div>
            </li>
          </ul>
        </div>
      </section>

      {/* ───────────────────────── footer ─────────────────────── */}
      <footer className="hd-foot">
        <div className="hd-wrap hd-titleblock">
          <div className="hd-tb-cell hd-tb-main">
            <span className="hd-mark"><Home size={15} /></span>
            <div>
              <strong>Home Designer Pro</strong>
              <em>Architectural planning in feet and inches</em>
            </div>
          </div>
          <div className="hd-tb-cell"><span>Release</span><strong>{VERSION}</strong></div>
          <div className="hd-tb-cell"><span>Platforms</span><strong>macOS, Windows</strong></div>
          <div className="hd-tb-cell">
            <span>Older builds</span>
            <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer">GitHub releases</a>
          </div>
          <div className="hd-tb-cell">
            <button onClick={onBackToHome} className="hd-btn hd-btn-quiet hd-btn-sm">Back to home</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.hd-page{
  --ink:#0C1B33; --ink-2:#2C4568; --ink-3:#51647F;
  --vellum:#EDF2F8; --paper:#FFFFFF;
  --blue:#2B6BE4; --blue-d:#1E4FB8; --blue-l:#7FC7E8;
  --bp:#06223F; --bp-2:#0A3057;
  --brass:#E0A42B; --verify:#17916B;
  --line:#D6E0EC;
  --r-lg:18px; --r-md:12px;
  --sans:'IBM Plex Sans',system-ui,-apple-system,sans-serif;
  --disp:'Space Grotesk','IBM Plex Sans',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); overflow-x:hidden; min-height:100vh; width:100%;
  -webkit-font-smoothing:antialiased;
}
.hd-page *,.hd-page *::before,.hd-page *::after{box-sizing:border-box}
.hd-page h1,.hd-page h2,.hd-page h3,.hd-page p,.hd-page ul,.hd-page ol,.hd-page dl,.hd-page dd{margin:0}
.hd-page ul,.hd-page ol{list-style:none;padding:0}
.hd-page a{color:inherit}
.hd-page :focus-visible{outline:2px solid var(--brass);outline-offset:3px;border-radius:4px}
.hd-wrap{max-width:1180px;margin:0 auto;padding:0 28px}

.hd-nav{position:sticky;top:0;z-index:60;height:66px;display:flex;align-items:center;
  justify-content:space-between;gap:18px;padding:0 28px;
  background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.hd-brand{display:flex;align-items:center;gap:9px;text-decoration:none}
.hd-mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#fff;
  background:linear-gradient(150deg,var(--blue),var(--blue-d));
  box-shadow:0 3px 10px rgba(43,107,228,.34);flex:none}
.hd-brand-name{font-family:var(--disp);font-weight:700;font-size:17px;letter-spacing:-.02em}
.hd-pro{font-family:var(--mono);font-size:10px;padding:2px 6px;border-radius:4px;
  color:var(--brass);background:rgba(224,164,43,.12);border:1px solid rgba(224,164,43,.35)}
.dl-back,.dl-gh{display:inline-flex;align-items:center;gap:7px;font-family:var(--sans);
  font-size:13.5px;font-weight:500;color:var(--ink-2);background:transparent;border:none;
  cursor:pointer;text-decoration:none;padding:7px 11px;border-radius:8px;transition:.18s}
.dl-back:hover,.dl-gh:hover{background:var(--vellum);color:var(--ink)}
.dl-gh{min-width:118px;justify-content:flex-end}
.dl-back{min-width:118px}

.hd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;
  font-family:var(--sans);font-weight:600;cursor:pointer;text-decoration:none;border-radius:10px;
  transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.hd-page .hd-btn-sm{font-size:13px;padding:9px 15px}
.hd-page .hd-btn-lg{font-size:14.5px;padding:13px 21px}
.hd-page .hd-btn-primary{color:#fff;background:linear-gradient(150deg,var(--blue),var(--blue-d));
  box-shadow:0 6px 18px -4px rgba(43,107,228,.55)}
.hd-page .hd-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 26px -6px rgba(43,107,228,.6)}
.hd-page .hd-btn-dark{color:#fff;background:var(--ink)}
.hd-page .hd-btn-dark:hover{transform:translateY(-2px);background:#16294a}
.hd-page .hd-btn-quiet{color:var(--ink);background:var(--vellum);border:1px solid var(--line)}
.hd-page .hd-btn-quiet:hover{background:#E1E9F3}

/* ---------- hero ---------- */
.dl-hero{position:relative;isolation:isolate;overflow:hidden;color:#fff;padding:76px 0 84px;
  background:radial-gradient(115% 100% at 22% 0%,var(--bp-2) 0%,var(--bp) 56%,#04182D 100%)}
.dl-hero::before{content:'';position:absolute;inset:0;z-index:-2;opacity:.5;
  background-image:linear-gradient(rgba(127,199,232,.13) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(127,199,232,.13) 1px,transparent 1px);
  background-size:24px 24px}
.dl-hero-glow{position:absolute;z-index:-1;width:680px;height:680px;left:-200px;top:-320px;
  border-radius:50%;background:radial-gradient(circle,rgba(43,107,228,.4),transparent 62%);
  filter:blur(20px);animation:hd-breathe 11s ease-in-out infinite}
.dl-hero-inner{animation:hd-rise .75s cubic-bezier(.22,1,.36,1) both}
.hd-chip{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-family:var(--mono);
  color:#BBDCF5;background:rgba(127,199,232,.12);border:1px solid rgba(127,199,232,.28);
  padding:6px 13px;border-radius:999px;margin-bottom:22px}
.hd-chip svg{color:var(--brass)}
.hd-h1{font-family:var(--disp);font-weight:700;font-size:clamp(31px,3.8vw,48px);line-height:1.1;
  letter-spacing:-.035em}
.dl-h1{margin-bottom:18px}
.hd-lede{font-size:16.5px;line-height:1.62;color:#A9C4DE}
.dl-lede{max-width:56ch}
.dl-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.dl-badges span{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:#C3D9EC;
  background:rgba(127,199,232,.09);border:1px solid rgba(127,199,232,.2);padding:7px 13px;border-radius:8px}
.dl-badges svg{color:var(--blue-l)}

/* ---------- platform sheets ---------- */
.hd-sec{padding:80px 28px}
.dl-sec-platforms{margin-top:-56px;padding-top:0;position:relative;z-index:5}
.dl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:24px;align-items:start}
.dl-card{position:relative;background:var(--paper);border:1px solid var(--line);
  border-radius:var(--r-lg);overflow:hidden;box-shadow:0 20px 46px -28px rgba(12,27,51,.5);
  transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.dl-card:hover{transform:translateY(-4px);box-shadow:0 30px 60px -30px rgba(12,27,51,.55)}
.dl-card.is-detected{border-color:var(--brass);box-shadow:0 24px 54px -26px rgba(224,164,43,.5)}
.dl-detected{position:absolute;z-index:3;top:16px;right:16px;font-family:var(--mono);font-size:10.5px;
  color:#5C3F06;background:var(--brass);padding:5px 11px;border-radius:6px;
  box-shadow:0 4px 12px rgba(224,164,43,.45)}
.dl-card-art{position:relative;background:#0B2743;height:150px}
.dl-sheetart{display:block;width:100%;height:150px}
.dl-os-icon{position:absolute;left:26px;bottom:-26px;width:56px;height:56px;border-radius:16px;
  display:grid;place-items:center;color:#fff;box-shadow:0 8px 20px -6px rgba(12,27,51,.6);
  border:3px solid #fff}
.dl-card-body{padding:44px 26px 26px}
.dl-card-body h2{font-family:var(--disp);font-size:23px;font-weight:700;letter-spacing:-.025em}
.dl-card-sub{font-size:13.5px;color:var(--ink-3);margin-top:4px}
.dl-specs{margin:20px 0 22px;border-top:1px solid var(--line)}
.dl-specs div{display:flex;justify-content:space-between;gap:16px;align-items:baseline;
  padding:10px 0;border-bottom:1px solid var(--line)}
.dl-specs dt{font-family:var(--mono);font-size:11px;color:var(--ink-3);flex:none}
.dl-specs dd{font-size:13.5px;font-weight:500;text-align:right}
.dl-dl{width:100%}
.dl-file{font-family:var(--mono);font-size:11px;color:var(--ink-3);text-align:center;margin-top:10px;
  word-break:break-all}
.dl-hint{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink-3);
  margin-top:16px;padding-top:16px;border-top:1px solid var(--line);line-height:1.5}
.dl-hint svg{color:var(--verify);flex:none;margin-top:1px}

/* ---------- steps ---------- */
.dl-sec-steps{background:var(--vellum);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.hd-sec-head{max-width:640px;margin-bottom:40px}
.hd-sec-head p{font-size:15.5px;line-height:1.6;color:var(--ink-3);margin-top:11px}
.hd-h2{font-family:var(--disp);font-weight:700;font-size:clamp(25px,2.8vw,33px);line-height:1.16;
  letter-spacing:-.03em}
.hd-h2-invert{color:#fff}
.hd-invert-p{font-size:16px;line-height:1.66;color:#A9C4DE;max-width:52ch;margin-top:16px}
.dl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;counter-reset:s}
.dl-steps li{background:var(--paper);border:1px solid var(--line);border-radius:var(--r-lg);padding:26px}
.dl-step-n{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;
  font-family:var(--mono);font-size:14px;color:#fff;
  background:linear-gradient(150deg,var(--blue),var(--blue-d));margin-bottom:16px}
.dl-steps h3{font-family:var(--disp);font-size:17px;font-weight:600;letter-spacing:-.02em;margin-bottom:8px}
.dl-steps p{font-size:13.5px;line-height:1.58;color:var(--ink-3)}

/* ---------- promise band ---------- */
.dl-sec-dark{background:linear-gradient(155deg,#0A2B4E,#04182D);color:#fff}
.dl-promise{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:48px;align-items:center}
.dl-promise-list{display:flex;flex-direction:column;gap:14px}
.dl-promise-list li{display:flex;gap:15px;align-items:flex-start;padding:18px;border-radius:14px;
  background:rgba(127,199,232,.06);border:1px solid rgba(127,199,232,.16)}
.dl-promise-list strong{display:block;font-family:var(--disp);font-size:15.5px;font-weight:600;margin-bottom:4px}
.dl-promise-list em{font-style:normal;font-size:13.3px;line-height:1.55;color:#9FBBD6}
.hd-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}
.hd-icon-blue{background:rgba(43,107,228,.18);color:#9BC2FF}
.hd-icon-green{background:rgba(23,145,107,.18);color:#6FD9B4}
.hd-icon-amber{background:rgba(224,164,43,.18);color:#F0C878}

/* ---------- footer ---------- */
.hd-foot{border-top:1px solid var(--line);background:var(--paper);padding:0 28px}
.hd-titleblock{display:grid;grid-template-columns:2fr 1fr 1.2fr 1.4fr auto;align-items:center}
.hd-tb-cell{padding:20px 18px;border-left:1px solid var(--line);min-height:84px;
  display:flex;flex-direction:column;justify-content:center;gap:4px}
.hd-tb-cell:first-child{border-left:none;padding-left:0}
.hd-tb-cell:last-child{border-left:none;padding-right:0;align-items:flex-end}
.hd-tb-cell span{font-family:var(--mono);font-size:10px;color:var(--ink-3)}
.hd-tb-cell strong{font-size:13.5px;font-weight:600}
.hd-tb-cell a{font-size:13px;color:var(--blue);text-decoration:none;font-weight:500}
.hd-tb-cell a:hover{text-decoration:underline}
.hd-tb-main{flex-direction:row;align-items:center;gap:11px}
.hd-tb-main strong{display:block;font-family:var(--disp);font-size:15px}
.hd-tb-main em{font-style:normal;font-size:12.5px;color:var(--ink-3)}

/* ---------- motion ---------- */
@keyframes hd-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes hd-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
@keyframes dl-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
.dl-card.is-detected .dl-dl svg{animation:dl-bob 2.2s ease-in-out infinite}
[data-reveal]{opacity:0;transform:translateY(20px);
  transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1)}
[data-reveal].is-in{opacity:1;transform:none}
.dl-grid [data-reveal]:nth-child(2){transition-delay:.09s}
.dl-steps [data-reveal]:nth-child(2){transition-delay:.08s}
.dl-steps [data-reveal]:nth-child(3){transition-delay:.16s}

/* ---------- responsive ---------- */
@media (max-width:940px){
  .dl-promise{grid-template-columns:1fr;gap:30px}
  .dl-steps{grid-template-columns:1fr}
  .hd-titleblock{grid-template-columns:1fr 1fr 1fr}
  .hd-tb-cell:nth-child(1){grid-column:span 3;border-bottom:1px solid var(--line)}
}
@media (max-width:760px){
  .hd-nav{padding:0 16px;height:58px;gap:8px}
  .hd-brand-name{display:none}
  .hd-pro{display:none}
  .dl-back span,.dl-gh span{display:none}
  .dl-back,.dl-gh{min-width:0}
  .hd-wrap,.hd-sec{padding-left:18px;padding-right:18px}
  .hd-sec{padding-top:56px;padding-bottom:56px}
  .dl-hero{padding:52px 0 72px}
  .hd-titleblock{grid-template-columns:1fr 1fr}
  .hd-tb-cell:nth-child(1){grid-column:span 2}
  .hd-tb-cell:last-child{align-items:flex-start}
}
@media (prefers-reduced-motion:reduce){
  .hd-page *{animation-duration:.01ms !important;animation-iteration-count:1 !important;
    transition-duration:.01ms !important}
  [data-reveal]{opacity:1;transform:none}
}
`;