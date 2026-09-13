import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Wand2,
  Sparkles,
  Download,
  ArrowRight,
  Layers,
  Box,
  Compass,
  ChefHat,
  Trees,
  BarChart3,
  Printer,
  CheckCircle2,
  Apple,
  Monitor,
  Zap,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { GITHUB_REPO_URL } from '../../core/platform';

interface LandingPageProps {
  onNavigateDownload: () => void;
}

/* ------------------------------------------------------------------ *
 *  Drawing geometry. The plan is modelled in real feet and projected
 *  to pixels, so the 2D sheet and the 3D view are the same building.
 * ------------------------------------------------------------------ */

const PX = 12;                 // pixels per foot
const OX = 104;                // plan origin on the sheet
const OY = 70;
const W_FT = 40;
const H_FT = 28;

const fx = (ft: number) => OX + ft * PX;
const fy = (ft: number) => OY + ft * PX;

/** rooms, in feet, measured from the top-left of the building */
const ROOMS = [
  { name: 'Bedroom', x: 0, y: 0, w: 16, h: 14, sub: "16'-0\" × 14'-0\"" },
  { name: 'Bedroom', x: 16, y: 0, w: 14, h: 14, sub: "14'-0\" × 14'-0\"" },
  { name: 'Bath', x: 30, y: 0, w: 10, h: 14, sub: "10'-0\" × 14'-0\"" },
  { name: 'Living', x: 0, y: 14, w: 23, h: 14, sub: "23'-0\" × 14'-0\"" },
  { name: 'Kitchen', x: 23, y: 14, w: 17, h: 14, sub: "17'-0\" × 14'-0\"" },
];

/** wall centre-lines, in feet */
const WALLS: Array<[number, number, number, number]> = [
  [0, 0, 40, 0], [40, 0, 40, 28], [40, 28, 0, 28], [0, 28, 0, 0],
  [0, 14, 40, 14], [16, 0, 16, 14], [30, 0, 30, 14], [23, 14, 23, 28],
];

/* isometric projection used by the 3D view */
const ISO_S = 0.79;
const iso = (x: number, y: number, z: number): [number, number] => [
  (x - y) * 0.866 * ISO_S * PX + 288,
  (x + y) * 0.5 * ISO_S * PX - z * ISO_S * PX + 182,
];
const pts = (a: Array<[number, number]>) => a.map((p) => p.join(',')).join(' ');

const delay = (s: number) => ({ ['--d' as never]: `${s}s` } as React.CSSProperties);

/* ------------------------------------------------------------------ *
 *  2D sheet
 * ------------------------------------------------------------------ */

const FloorPlan2D: React.FC = () => {
  const WALL = 6;
  return (
    <svg viewBox="0 0 680 600" className="hd-svg" role="img" aria-label="Floor plan of a 3 BHK house, drawn in feet and inches">
      <defs>
        <pattern id="hdGrid" width={PX} height={PX} patternUnits="userSpaceOnUse">
          <path d={`M ${PX} 0 L 0 0 0 ${PX}`} fill="none" stroke="rgba(127,199,232,.16)" strokeWidth="1" />
        </pattern>
        <pattern id="hdGridBig" width={PX * 5} height={PX * 5} patternUnits="userSpaceOnUse">
          <rect width={PX * 5} height={PX * 5} fill="url(#hdGrid)" />
          <path d={`M ${PX * 5} 0 L 0 0 0 ${PX * 5}`} fill="none" stroke="rgba(127,199,232,.30)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="680" height="600" fill="url(#hdGridBig)" />
      <rect x="16" y="16" width="648" height="568" fill="none" stroke="rgba(127,199,232,.45)" strokeWidth="1.5" />
      <rect x="24" y="24" width="632" height="552" fill="none" stroke="rgba(127,199,232,.22)" strokeWidth="1" />

      {/* room floors */}
      {ROOMS.map((r, i) => (
        <rect
          key={`f${i}`}
          className="hd-pop"
          style={delay(1.5 + i * 0.08)}
          x={fx(r.x)} y={fy(r.y)} width={r.w * PX} height={r.h * PX}
          fill={i === 3 ? 'rgba(43,107,228,.20)' : 'rgba(127,199,232,.07)'}
        />
      ))}

      {/* walls */}
      {WALLS.map(([x1, y1, x2, y2], i) => (
        <line
          key={`w${i}`}
          className="hd-draw"
          style={delay(i < 4 ? 0.15 + i * 0.16 : 0.95 + (i - 4) * 0.13)}
          x1={fx(x1)} y1={fy(y1)} x2={fx(x2)} y2={fy(y2)}
          stroke="#EAF4FF" strokeWidth={i < 4 ? WALL : WALL - 1.5} strokeLinecap="square"
        />
      ))}

      {/* window openings cut into the outer wall */}
      {[
        [4, 0, 9, 0], [19, 0, 24, 0], [33, 0, 38, 0],
        [0, 4, 0, 9], [40, 18, 40, 24], [28, 28, 34, 28],
      ].map(([x1, y1, x2, y2], i) => (
        <g key={`o${i}`} className="hd-pop" style={delay(2.0 + i * 0.06)}>
          <line x1={fx(x1)} y1={fy(y1)} x2={fx(x2)} y2={fy(y2)} stroke="#06223F" strokeWidth={WALL + 1} />
          <line x1={fx(x1)} y1={fy(y1)} x2={fx(x2)} y2={fy(y2)} stroke="#7FC7E8" strokeWidth="1.4" />
          <line
            x1={fx(x1) + (y1 === y2 ? 0 : 2.4)} y1={fy(y1) + (y1 === y2 ? 2.4 : 0)}
            x2={fx(x2) + (y1 === y2 ? 0 : 2.4)} y2={fy(y2) + (y1 === y2 ? 2.4 : 0)}
            stroke="#7FC7E8" strokeWidth="1.4"
          />
        </g>
      ))}

      {/* door swings */}
      {[
        { p: `M ${fx(4)} ${fy(14)} L ${fx(4)} ${fy(11)} A ${3 * PX} ${3 * PX} 0 0 1 ${fx(7)} ${fy(14)}`, cut: [fx(4), fy(14), fx(7), fy(14)] },
        { p: `M ${fx(20)} ${fy(14)} L ${fx(20)} ${fy(11)} A ${3 * PX} ${3 * PX} 0 0 1 ${fx(23)} ${fy(14)}`, cut: [fx(20), fy(14), fx(23), fy(14)] },
        { p: `M ${fx(33)} ${fy(14)} L ${fx(33)} ${fy(11)} A ${3 * PX} ${3 * PX} 0 0 1 ${fx(36)} ${fy(14)}`, cut: [fx(33), fy(14), fx(36), fy(14)] },
        { p: `M ${fx(23)} ${fy(18)} L ${fx(26)} ${fy(18)} A ${3 * PX} ${3 * PX} 0 0 1 ${fx(23)} ${fy(21)}`, cut: [fx(23), fy(18), fx(23), fy(21)] },
        { p: `M ${fx(8)} ${fy(28)} L ${fx(8)} ${fy(24)} A ${4 * PX} ${4 * PX} 0 0 0 ${fx(12)} ${fy(28)}`, cut: [fx(8), fy(28), fx(12), fy(28)] },
      ].map((dr, i) => (
        <g key={`d${i}`}>
          <line className="hd-pop" style={delay(1.85 + i * 0.07)} x1={dr.cut[0]} y1={dr.cut[1]} x2={dr.cut[2]} y2={dr.cut[3]} stroke="#06223F" strokeWidth={WALL + 1} />
          <path className="hd-draw hd-draw-s" style={delay(1.9 + i * 0.07)} d={dr.p} fill="none" stroke="#7FC7E8" strokeWidth="1.6" />
        </g>
      ))}

      {/* room names */}
      {ROOMS.map((r, i) => (
        <g key={`t${i}`} className="hd-rise" style={delay(2.5 + i * 0.09)}>
          <text x={fx(r.x + r.w / 2)} y={fy(r.y + r.h / 2) - 4} textAnchor="middle" className="hd-room">{r.name}</text>
          <text x={fx(r.x + r.w / 2)} y={fy(r.y + r.h / 2) + 13} textAnchor="middle" className="hd-dim">{r.sub}</text>
        </g>
      ))}

      {/* dimension strings */}
      <g className="hd-rise" style={delay(3.0)}>
        <line x1={fx(0)} y1={fy(28) + 26} x2={fx(40)} y2={fy(28) + 26} stroke="#E0A42B" strokeWidth="1.2" />
        {[0, 40].map((t) => (
          <line key={t} x1={fx(t)} y1={fy(28) + 20} x2={fx(t)} y2={fy(28) + 32} stroke="#E0A42B" strokeWidth="1.6" />
        ))}
        <rect x={fx(20) - 34} y={fy(28) + 17} width="68" height="18" fill="#06223F" />
        <text x={fx(20)} y={fy(28) + 30} textAnchor="middle" className="hd-dim hd-dim-b">40'-0"</text>
      </g>

      <g className="hd-rise" style={delay(3.12)}>
        <line x1={fx(0)} y1={fy(28) + 52} x2={fx(40)} y2={fy(28) + 52} stroke="#E0A42B" strokeWidth="1.2" opacity=".7" />
        {[0, 23, 40].map((t) => (
          <line key={t} x1={fx(t)} y1={fy(28) + 47} x2={fx(t)} y2={fy(28) + 57} stroke="#E0A42B" strokeWidth="1.4" opacity=".7" />
        ))}
        <rect x={fx(11.5) - 30} y={fy(28) + 43} width="60" height="18" fill="#06223F" />
        <text x={fx(11.5)} y={fy(28) + 56} textAnchor="middle" className="hd-dim hd-dim-b">23'-0"</text>
        <rect x={fx(31.5) - 30} y={fy(28) + 43} width="60" height="18" fill="#06223F" />
        <text x={fx(31.5)} y={fy(28) + 56} textAnchor="middle" className="hd-dim hd-dim-b">17'-0"</text>
      </g>

      <g className="hd-rise" style={delay(3.24)}>
        <line x1={fx(0) - 30} y1={fy(0)} x2={fx(0) - 30} y2={fy(28)} stroke="#E0A42B" strokeWidth="1.2" />
        {[0, 28].map((t) => (
          <line key={t} x1={fx(0) - 36} y1={fy(t)} x2={fx(0) - 24} y2={fy(t)} stroke="#E0A42B" strokeWidth="1.6" />
        ))}
        <rect x={fx(0) - 44} y={fy(14) - 10} width="28" height="20" fill="#06223F" />
        <text x={fx(0) - 30} y={fy(14) + 4} textAnchor="middle" className="hd-dim hd-dim-b">28'-0"</text>
      </g>

      {/* north arrow and sun path */}
      <g className="hd-rise" style={delay(3.4)}><g transform="translate(618,104)">
        <circle r="27" fill="none" stroke="rgba(127,199,232,.4)" strokeWidth="1" />
        <path className="hd-needle" d="M 0 -21 L 6.5 6 L 0 1.5 L -6.5 6 Z" fill="#E0A42B" />
        <text y="-33" textAnchor="middle" className="hd-dim hd-dim-b">N</text>
        <path d="M -38 6 A 38 38 0 0 1 38 6" fill="none" stroke="rgba(224,164,43,.45)" strokeWidth="1" strokeDasharray="3 4" />
        <circle className="hd-sun" r="3.5" fill="#E0A42B" />
      </g></g>

      {/* title block, bottom right, the way a real sheet carries it */}
      <g className="hd-rise" style={delay(3.55)}>
        <rect x="404" y="486" width="252" height="76" fill="rgba(6,34,63,.85)" stroke="rgba(127,199,232,.4)" strokeWidth="1" />
        <line x1="404" y1="512" x2="656" y2="512" stroke="rgba(127,199,232,.25)" strokeWidth="1" />
        <line x1="530" y1="512" x2="530" y2="562" stroke="rgba(127,199,232,.25)" strokeWidth="1" />
        <text x="416" y="504" className="hd-tb-title">Ground Floor Plan</text>
        <text x="416" y="528" className="hd-tb-k">Scale</text>
        <text x="416" y="546" className="hd-tb-v">1/4" = 1'-0"</text>
        <text x="542" y="528" className="hd-tb-k">Units</text>
        <text x="542" y="546" className="hd-tb-v">Feet &amp; inches</text>
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ *
 *  3D view, built from the same walls
 * ------------------------------------------------------------------ */

const House3D: React.FC = () => {
  const H = 9;
  const faces = WALLS.map(([x1, y1, x2, y2]) => {
    const quad: Array<[number, number]> = [
      iso(x1, y1, 0), iso(x2, y2, 0), iso(x2, y2, H), iso(x1, y1, H),
    ];
    return { quad, depth: Math.max(x1 + y1, x2 + y2), vertical: x1 === x2 };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <svg viewBox="0 0 680 600" className="hd-svg" role="img" aria-label="The same house shown as a 3D model">
      <rect x="0" y="0" width="680" height="600" fill="url(#hdGridBig)" />
      <rect x="16" y="16" width="648" height="568" fill="none" stroke="rgba(127,199,232,.45)" strokeWidth="1.5" />

      {/* ground slab */}
      <polygon
        points={pts([iso(-1.5, -1.5, 0), iso(W_FT + 1.5, -1.5, 0), iso(W_FT + 1.5, H_FT + 1.5, 0), iso(-1.5, H_FT + 1.5, 0)])}
        fill="rgba(10,48,87,.9)" stroke="rgba(127,199,232,.35)" strokeWidth="1"
      />

      {/* room floors */}
      {ROOMS.map((r, i) => (
        <polygon
          key={i}
          points={pts([iso(r.x, r.y, 0), iso(r.x + r.w, r.y, 0), iso(r.x + r.w, r.y + r.h, 0), iso(r.x, r.y + r.h, 0)])}
          fill={i === 3 ? 'rgba(43,107,228,.34)' : 'rgba(127,199,232,.12)'}
          stroke="rgba(127,199,232,.25)" strokeWidth="1"
        />
      ))}

      {faces.map((f, i) => (
        <polygon
          key={i}
          className="hd-rise"
          style={delay(0.06 * i)}
          points={pts(f.quad)}
          fill={f.vertical ? 'rgba(234,244,255,.20)' : 'rgba(234,244,255,.32)'}
          stroke="#EAF4FF" strokeWidth="1.3" strokeLinejoin="round"
        />
      ))}

      {ROOMS.map((r, i) => {
        const [cx, cy] = iso(r.x + r.w / 2, r.y + r.h / 2, 0);
        return (
          <text key={i} x={cx} y={cy} textAnchor="middle" className="hd-room hd-room-3d">{r.name}</text>
        );
      })}

      <g transform="translate(560,506)">
        <text className="hd-tb-k" y="0">Camera</text>
        <text className="hd-tb-v" y="18">Orbit and walk</text>
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ *
 *  Small diagrams used inside the feature panels
 * ------------------------------------------------------------------ */

const ZONES = [
  'Ishanya', 'North', 'Vayavya',
  'East', 'Brahmasthan', 'West',
  'Agni', 'South', 'Nairutya',
];

const VastuDial: React.FC = () => {
  const [live, setLive] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setLive((v) => (v + 1) % 9), 1400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="hd-vastu">
      {ZONES.map((z, i) => (
        <div key={z} className={`hd-zone${i === live ? ' is-live' : ''}${i === 4 ? ' is-core' : ''}`}>
          <span>{z}</span>
        </div>
      ))}
    </div>
  );
};

const KITCHENS: Array<{ k: string; cells: number[] }> = [
  { k: 'L-shape', cells: [1, 1, 1, 1, 0, 0, 1, 0, 0] },
  { k: 'U-shape', cells: [1, 1, 1, 1, 0, 1, 1, 0, 1] },
  { k: 'Parallel', cells: [1, 0, 1, 1, 0, 1, 1, 0, 1] },
  { k: 'Island', cells: [1, 1, 1, 0, 1, 0, 0, 0, 0] },
];

const KitchenLayouts: React.FC = () => (
  <div className="hd-kits">
    {KITCHENS.map((kt) => (
      <div key={kt.k} className="hd-kit">
        <div className="hd-kit-grid">
          {kt.cells.map((c, i) => <i key={i} className={c ? 'on' : ''} />)}
        </div>
        <span>{kt.k}</span>
      </div>
    ))}
  </div>
);

/** miniature plan drawn for each starter template */
const PlanThumb: React.FC<{ cells: Array<[number, number, number, number]>; accent: string }> = ({ cells, accent }) => (
  <svg viewBox="0 0 240 150" className="hd-thumb" aria-hidden="true">
    <rect x="0" y="0" width="240" height="150" fill="#0B2743" />
    <g opacity=".5">
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="150" stroke="rgba(127,199,232,.16)" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 20} x2="240" y2={i * 20} stroke="rgba(127,199,232,.16)" strokeWidth="1" />
      ))}
    </g>
    {cells.map(([x, y, w, h], i) => (
      <rect key={i} x={x} y={y} width={w} height={h}
        fill={i === 0 ? `${accent}44` : 'rgba(127,199,232,.10)'}
        stroke="#DCEBFA" strokeWidth="2.4" />
    ))}
    <rect x="12" y="10" width="216" height="130" fill="none" stroke="#EAF4FF" strokeWidth="3.5" />
  </svg>
);

/* ------------------------------------------------------------------ */

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateDownload }) => {
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const root = useRef<HTMLDivElement>(null);

  /* reveal sections as they enter the viewport */
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
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const features = [
    { icon: <Layers size={20} />, tone: 'blue', title: 'Feet and inches, natively', description: 'Walls, doors, windows and slabs carry true architectural dimensions. Nothing is converted to metric behind your back.' },
    { icon: <Box size={20} />, tone: 'blue', title: 'Plan and model stay in sync', description: 'Every wall you draw in 2D exists in 3D immediately. Orbit it, walk through it, or run a sun study on it.' },
    { icon: <Wand2 size={20} />, tone: 'green', title: 'Describe a plan in plain words', description: 'Type “3 BHK 30x40 with kitchen in SE” and get a working layout. Runs on your machine, no API key, no account.' },
    { icon: <ChefHat size={20} />, tone: 'amber', title: 'Modular kitchen studio', description: 'Lay out L, U, parallel and island cabinetry with cooktops, chimney hoods, sinks and ovens sized to fit.' },
    { icon: <Trees size={20} />, tone: 'green', title: 'Site and landscape', description: 'Set the survey boundary and zoning setbacks, then place pools, driveways, patios and shade trees.' },
    { icon: <BarChart3 size={20} />, tone: 'blue', title: 'A bill of quantities that adds up', description: 'Carpet area, built-up area, masonry volume, plaster and tile takeoff, costed in rupees or dollars.' },
    { icon: <Printer size={20} />, tone: 'slate', title: 'Blueprints your contractor accepts', description: 'Export print-ready 2D drawing sheets and PDF documentation at full resolution.' },
    { icon: <Cpu size={20} />, tone: 'slate', title: 'Runs on your own hardware', description: 'GPU-accelerated rendering, local files, and an installer under 10 MB. No cloud round trip.' },
  ];

  const templates = [
    {
      title: '3 BHK luxury villa', size: "40′ × 50′", area: '2,000 sq ft', tag: 'Most downloaded', accent: '#2B6BE4',
      desc: 'Master suite with attached bath, two bedrooms, modular kitchen to the south-east, a grand living hall, puja room and dining.',
      cells: [[20, 18, 92, 60], [112, 18, 116, 60], [20, 78, 66, 54], [86, 78, 62, 54], [148, 78, 80, 54]] as Array<[number, number, number, number]>,
    },
    {
      title: '2 BHK modern home', size: "30′ × 40′", area: '1,200 sq ft', tag: 'Compact plot', accent: '#17916B',
      desc: 'An efficient urban family layout with the master bedroom to the south-west, a guest room, open kitchen, living room and two baths.',
      cells: [[20, 18, 100, 56], [120, 18, 108, 56], [20, 74, 74, 58], [94, 74, 56, 58], [150, 74, 78, 58]] as Array<[number, number, number, number]>,
    },
    {
      title: 'Vastu-aligned 3 BHK', size: "35′ × 45′", area: '1,575 sq ft', tag: 'Nine-zone checked', accent: '#E0A42B',
      desc: 'Laid out strictly to the nine Vastu zones, with the kitchen in Agni, the master bedroom in Nairutya and the living room opening to Ishanya.',
      cells: [[20, 18, 70, 48], [90, 18, 68, 48], [158, 18, 70, 48], [20, 66, 104, 66], [124, 66, 104, 66]] as Array<[number, number, number, number]>,
    },
  ];

  return (
    <div className="hd-page" ref={root}>
      <style>{CSS}</style>

      <header className="hd-nav">
        <a className="hd-brand" href="#top">
          <span className="hd-mark"><Home size={17} /></span>
          <span className="hd-brand-name">Home Designer</span>
          <span className="hd-pro">Pro</span>
        </a>

        <nav className="hd-nav-links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#build">3D view</a>
        </nav>

        <button onClick={onNavigateDownload} className="hd-btn hd-btn-primary hd-btn-sm">
          <Download size={15} />
          <span className="hd-wide-only">Download the app</span>
          <span className="hd-narrow-only">Get app</span>
        </button>
      </header>

      {/* ───────────────────────── hero ───────────────────────── */}
      <section className="hd-hero" id="top">
        <div className="hd-hero-glow" aria-hidden="true" />
        <div className="hd-hero-inner">
          <div className="hd-hero-copy">
            <span className="hd-chip">
              <Sparkles size={13} />
              Version 1.0 for macOS and Windows
            </span>

            <h1 className="hd-h1">
              Plan your house<br />down to the inch.
            </h1>

            <p className="hd-lede">
              A free desktop app for planning Indian homes. Draw in 2D, walk through it in 3D,
              check the Vastu zones and price the whole build, all on your own machine.
            </p>

            <div className="hd-cta-row">
              <button onClick={onNavigateDownload} className="hd-btn hd-btn-primary hd-btn-lg">
                <Download size={17} />
                <span>Download for Mac or Windows</span>
                <ArrowRight size={15} />
              </button>
              <a href="#features" className="hd-btn hd-btn-ghost hd-btn-lg">See features</a>
            </div>

            <ul className="hd-trust">
              <li><CheckCircle2 size={15} /> Free, no account</li>
              <li><CheckCircle2 size={15} /> Works fully offline</li>
              <li><CheckCircle2 size={15} /> Under 10 MB to install</li>
            </ul>
          </div>

          <div className="hd-hero-sheet">
            <div className="hd-viewtabs" role="tablist" aria-label="Drawing view">
              <button role="tab" aria-selected={view === '2d'} className={view === '2d' ? 'is-on' : ''} onClick={() => setView('2d')}>2D plan</button>
              <button role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'is-on' : ''} onClick={() => setView('3d')}>3D model</button>
            </div>
            <div className="hd-sheet">
              <div key={view} className="hd-sheet-swap">
                {view === '2d' ? <FloorPlan2D /> : <House3D />}
              </div>
            </div>
            <p className="hd-sheet-cap">Same building, same walls. Switching view does not redraw anything.</p>
          </div>
        </div>

        {/* measurement band, styled as a dimension string */}
        <div className="hd-measure">
          {[
            ['8', 'design modules'],
            ['2D + 3D', 'always in sync'],
            ['9', 'Vastu zones scored'],
            ['0', 'internet connection needed'],
          ].map(([v, k]) => (
            <div className="hd-measure-cell" key={k}>
              <strong>{v}</strong>
              <span>{k}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── features ─────────────────────── */}
      <section id="features" className="hd-sec hd-sec-light">
        <div className="hd-wrap">
          <div className="hd-sec-head" data-reveal>
            <h2 className="hd-h2">Everything a house plan needs</h2>
            <p>Eight modules that talk to each other, so a change to a wall updates the model, the Vastu score and the quantities at the same time.</p>
          </div>

          <div className="hd-bento">
            <article className="hd-panel hd-panel-wide" data-reveal>
              <div className="hd-panel-body">
                <span className="hd-icon hd-icon-amber"><Compass size={20} /></span>
                <h3>Vastu checked, zone by zone</h3>
                <p>
                  The plan is divided into the nine traditional zones and every room is scored against the
                  direction it sits in. You see which placements help and which ones fight the layout,
                  before anything is built.
                </p>
              </div>
              <VastuDial />
            </article>

            <article className="hd-panel hd-panel-wide" data-reveal>
              <div className="hd-panel-body">
                <span className="hd-icon hd-icon-blue"><ChefHat size={20} /></span>
                <h3>Four kitchen layouts, fitted to your room</h3>
                <p>
                  Pick a cabinetry arrangement and the studio fits the run to the walls you drew,
                  keeping the work triangle between sink, cooktop and refrigerator sensible.
                </p>
              </div>
              <KitchenLayouts />
            </article>

            {features.map((f) => (
              <article key={f.title} className="hd-card" data-reveal>
                <span className={`hd-icon hd-icon-${f.tone}`}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── templates ────────────────────── */}
      <section id="templates" className="hd-sec">
        <div className="hd-wrap">
          <div className="hd-sec-head" data-reveal>
            <h2 className="hd-h2">Start from a plan that already works</h2>
            <p>Open a template, drag a wall, and every dimension, area and cost figure follows along.</p>
          </div>

          <div className="hd-tmpl-grid">
            {templates.map((t) => (
              <article key={t.title} className="hd-tmpl" data-reveal>
                <div className="hd-tmpl-art">
                  <PlanThumb cells={t.cells} accent={t.accent} />
                  <span className="hd-tag" style={{ color: t.accent, borderColor: `${t.accent}77` }}>{t.tag}</span>
                </div>
                <div className="hd-tmpl-body">
                  <h3>{t.title}</h3>
                  <p className="hd-tmpl-meta">{t.size}<i /> {t.area}</p>
                  <p>{t.desc}</p>
                  <button onClick={onNavigateDownload} className="hd-btn hd-btn-quiet">Open this template</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── 3D band ──────────────────────── */}
      <section id="build" className="hd-sec hd-sec-dark">
        <div className="hd-wrap hd-split">
          <div data-reveal>
            <h2 className="hd-h2 hd-h2-invert">From plan to walkthrough<br />without redrawing anything</h2>
            <p className="hd-invert-p">
              The 3D model is not an export. It is the same building, rebuilt every time you move a wall,
              so what you see in perspective is always what is on the drawing sheet.
            </p>
            <ul className="hd-checks">
              <li><CheckCircle2 size={16} /> Orbit camera and first-person walk</li>
              <li><CheckCircle2 size={16} /> Solar study for daylight and shadow</li>
              <li><CheckCircle2 size={16} /> Hardware-accelerated, no cloud render</li>
            </ul>
            <button onClick={onNavigateDownload} className="hd-btn hd-btn-primary hd-btn-lg">
              <Download size={17} />
              <span>Get the desktop app</span>
            </button>
          </div>
          <div className="hd-iso" data-reveal>
            <House3D />
          </div>
        </div>
      </section>

      {/* ─────────────────────── download ─────────────────────── */}
      <section className="hd-sec hd-sec-cta">
        <div className="hd-wrap hd-cta-inner">
          <h2 className="hd-h2 hd-h2-invert">Install it and start drawing</h2>
          <p className="hd-invert-p">
            One download, no sign-up. The app keeps your drawings as files on your own disk.
          </p>
          <div className="hd-cta-row hd-cta-center">
            <button onClick={onNavigateDownload} className="hd-btn hd-btn-light hd-btn-lg">
              <Apple size={18} /><span>macOS (.dmg)</span>
            </button>
            <button onClick={onNavigateDownload} className="hd-btn hd-btn-outline hd-btn-lg">
              <Monitor size={18} /><span>Windows (.exe)</span>
            </button>
          </div>
          <div className="hd-cta-meta">
            <span><ShieldCheck size={14} /> No account, no telemetry</span>
            <span><Zap size={14} /> Installer under 10 MB</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────── footer ───────────────────────── */}
      <footer className="hd-foot">
        <div className="hd-wrap hd-titleblock">
          <div className="hd-tb-cell hd-tb-main">
            <span className="hd-mark"><Home size={15} /></span>
            <div>
              <strong>Home Designer Pro</strong>
              <em>Architectural planning in feet and inches</em>
            </div>
          </div>
          <div className="hd-tb-cell"><span>Version</span><strong>1.0.0</strong></div>
          <div className="hd-tb-cell"><span>Platforms</span><strong>macOS, Windows</strong></div>
          <div className="hd-tb-cell">
            <span>Source</span>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">github.com/sahil3785</a>
          </div>
          <div className="hd-tb-cell">
            <button onClick={onNavigateDownload} className="hd-btn hd-btn-primary hd-btn-sm">
              <Download size={14} /><span>Download</span>
            </button>
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
  --r-lg:18px; --r-md:12px; --r-sm:8px;
  --sans:'IBM Plex Sans',system-ui,-apple-system,sans-serif;
  --disp:'Space Grotesk','IBM Plex Sans',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); overflow-x:hidden; min-height:100vh; width:100%;
  -webkit-font-smoothing:antialiased;
}
.hd-page *,.hd-page *::before,.hd-page *::after{box-sizing:border-box}
.hd-page h1,.hd-page h2,.hd-page h3,.hd-page p,.hd-page ul{margin:0}
.hd-page ul{list-style:none;padding:0}
.hd-page a{color:inherit}
.hd-page :focus-visible{outline:2px solid var(--brass);outline-offset:3px;border-radius:4px}
.hd-wrap{max-width:1180px;margin:0 auto;padding:0 28px}

/* ---------- nav ---------- */
.hd-nav{position:sticky;top:0;z-index:60;height:66px;display:flex;align-items:center;
  justify-content:space-between;gap:20px;padding:0 28px;
  background:rgba(255,255,255,.86);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--line)}
.hd-brand{display:flex;align-items:center;gap:9px;text-decoration:none}
.hd-mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#fff;
  background:linear-gradient(150deg,var(--blue),var(--blue-d));
  box-shadow:0 3px 10px rgba(43,107,228,.34);flex:none}
.hd-brand-name{font-family:var(--disp);font-weight:700;font-size:17px;letter-spacing:-.02em}
.hd-pro{font-family:var(--mono);font-size:10px;font-weight:500;padding:2px 6px;border-radius:4px;
  color:var(--brass);background:rgba(224,164,43,.12);border:1px solid rgba(224,164,43,.35)}
.hd-nav-links{display:flex;gap:4px}
.hd-nav-links a{font-size:13.5px;font-weight:500;color:var(--ink-2);text-decoration:none;
  padding:7px 12px;border-radius:7px;transition:background .18s,color .18s}
.hd-nav-links a:hover{background:var(--vellum);color:var(--ink)}
.hd-narrow-only{display:none}

/* ---------- buttons ---------- */
.hd-page .hd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;
  font-family:var(--sans);font-weight:600;cursor:pointer;text-decoration:none;
  border-radius:10px;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.hd-page .hd-btn-sm{font-size:13px;padding:9px 15px}
.hd-page .hd-btn-lg{font-size:14.5px;padding:13px 21px}
.hd-page .hd-btn-primary{color:#fff;background:linear-gradient(150deg,var(--blue),var(--blue-d));
  box-shadow:0 6px 18px -4px rgba(43,107,228,.55)}
.hd-page .hd-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 26px -6px rgba(43,107,228,.6)}
.hd-page .hd-btn-ghost{color:var(--ink);background:#fff;border:1px solid var(--line);box-shadow:0 1px 2px rgba(12,27,51,.05)}
.hd-page .hd-btn-ghost:hover{transform:translateY(-2px);border-color:#B9C8DC}
.hd-page .hd-btn-quiet{width:100%;font-size:13.5px;padding:11px 14px;color:var(--ink);
  background:var(--vellum);border:1px solid var(--line)}
.hd-page .hd-btn-quiet:hover{background:#E3EAF4}
.hd-page .hd-btn-light{color:var(--bp);background:#fff}
.hd-page .hd-btn-light:hover{transform:translateY(-2px)}
.hd-page .hd-btn-outline{color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.28)}
.hd-page .hd-btn-outline:hover{background:rgba(255,255,255,.16);transform:translateY(-2px)}

/* ---------- hero ---------- */
.hd-hero{position:relative;isolation:isolate;overflow:hidden;
  background:radial-gradient(120% 90% at 78% 8%,var(--bp-2) 0%,var(--bp) 55%,#04182D 100%);
  color:#fff;padding:56px 28px 0}
.hd-hero::before{content:'';position:absolute;inset:0;z-index:-2;opacity:.5;
  background-image:linear-gradient(rgba(127,199,232,.13) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(127,199,232,.13) 1px,transparent 1px);
  background-size:24px 24px}
.hd-hero-glow{position:absolute;z-index:-1;width:760px;height:760px;right:-160px;top:-280px;
  border-radius:50%;background:radial-gradient(circle,rgba(43,107,228,.42),transparent 62%);
  filter:blur(24px);animation:hd-breathe 11s ease-in-out infinite}
.hd-hero-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,1fr);
  gap:48px;align-items:center}
.hd-hero-copy{animation:hd-rise .8s cubic-bezier(.22,1,.36,1) both}
.hd-chip{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;
  color:#BBDCF5;background:rgba(127,199,232,.12);border:1px solid rgba(127,199,232,.28);
  padding:6px 13px;border-radius:999px;margin-bottom:22px}
.hd-chip svg{color:var(--brass)}
.hd-h1{font-family:var(--disp);font-weight:700;font-size:clamp(31px,3.6vw,46px);line-height:1.1;
  letter-spacing:-.035em;margin-bottom:24px}
.hd-lede{font-size:16.5px;line-height:1.62;color:#A9C4DE;max-width:52ch;margin-bottom:30px}
.hd-cta-row{display:flex;flex-wrap:wrap;gap:13px}
.hd-cta-center{justify-content:center}
.hd-trust{display:flex;flex-wrap:wrap;gap:20px;margin-top:30px;font-size:13px;color:#93B2CE}
.hd-trust li{display:flex;align-items:center;gap:7px}
.hd-trust svg{color:var(--verify)}

.hd-hero-sheet{animation:hd-rise .9s .12s cubic-bezier(.22,1,.36,1) both}
.hd-viewtabs{display:inline-flex;gap:3px;padding:3px;margin-bottom:12px;border-radius:9px;
  background:rgba(6,34,63,.6);border:1px solid rgba(127,199,232,.25)}
.hd-viewtabs button{font-family:var(--mono);font-size:11.5px;letter-spacing:.02em;padding:6px 14px;
  border:none;border-radius:6px;cursor:pointer;background:transparent;color:#8FB4D4;transition:.18s}
.hd-viewtabs button.is-on{background:var(--blue);color:#fff}
.hd-viewtabs button:not(.is-on):hover{color:#D6EBFB}
.hd-sheet{border:1px solid rgba(127,199,232,.3);border-radius:var(--r-md);overflow:hidden;
  background:linear-gradient(180deg,rgba(10,48,87,.55),rgba(4,24,45,.55));
  box-shadow:0 28px 60px -24px rgba(0,0,0,.7)}
.hd-sheet-swap{animation:hd-fade .45s ease both}
.hd-svg{display:block;width:100%;height:auto}
.hd-sheet-cap{font-size:12.5px;color:#7E9EBC;margin-top:11px;text-align:right}

.hd-room{font-family:var(--disp);font-size:14px;font-weight:600;fill:#EAF4FF;letter-spacing:-.01em}
.hd-room-3d{font-size:12px;fill:#CFE6F8}
.hd-dim{font-family:var(--mono);font-size:10.5px;fill:#8FB4D4}
.hd-dim-b{fill:var(--brass)}
.hd-tb-title{font-family:var(--disp);font-size:13px;font-weight:600;fill:#EAF4FF}
.hd-tb-k{font-family:var(--mono);font-size:9.5px;fill:#7E9EBC}
.hd-tb-v{font-family:var(--mono);font-size:11px;fill:#CFE6F8}

/* ---------- measurement band ---------- */
.hd-measure{max-width:1180px;margin:60px auto 0;display:grid;grid-template-columns:repeat(4,1fr);
  border-top:1px solid rgba(127,199,232,.22)}
.hd-measure-cell{padding:26px 18px 34px;text-align:center;position:relative}
.hd-measure-cell+.hd-measure-cell{border-left:1px solid rgba(127,199,232,.16)}
.hd-measure-cell::before{content:'';position:absolute;top:-1px;left:50%;width:1px;height:9px;
  background:var(--brass)}
.hd-measure-cell strong{display:block;font-family:var(--disp);font-size:27px;font-weight:700;
  letter-spacing:-.03em;color:#fff;margin-bottom:5px}
.hd-measure-cell span{font-size:12.5px;color:#8FB4D4}

/* ---------- sections ---------- */
.hd-sec{padding:86px 28px}
.hd-sec-light{background:var(--vellum);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.hd-sec-dark{background:linear-gradient(155deg,#0A2B4E,#04182D);color:#fff}
.hd-sec-cta{background:linear-gradient(150deg,var(--blue-d),#123A8C 55%,#0C1B33);color:#fff;text-align:center}
.hd-sec-head{max-width:680px;margin-bottom:44px}
.hd-sec-head p{font-size:15.5px;line-height:1.62;color:var(--ink-3);margin-top:12px}
.hd-h2{font-family:var(--disp);font-weight:700;font-size:clamp(26px,3vw,35px);line-height:1.16;
  letter-spacing:-.03em}
.hd-h2-invert{color:#fff}
.hd-invert-p{font-size:16px;line-height:1.66;color:#A9C4DE;max-width:54ch;margin-top:16px}

/* ---------- bento ---------- */
.hd-bento{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.hd-panel,.hd-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--r-lg);
  transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.hd-panel:hover,.hd-card:hover{transform:translateY(-3px);border-color:#BED0E5;
  box-shadow:0 16px 34px -20px rgba(12,27,51,.4)}
.hd-panel-wide{grid-column:span 2;display:grid;grid-template-columns:1fr auto;gap:24px;
  align-items:center;padding:28px;background:
    linear-gradient(#fff,#fff) padding-box,
    linear-gradient(140deg,#DCE6F3,#F2F6FB) border-box;border:1px solid transparent}
.hd-panel-body h3{font-family:var(--disp);font-size:19px;font-weight:600;letter-spacing:-.02em;margin:14px 0 9px}
.hd-panel-body p{font-size:13.8px;line-height:1.6;color:var(--ink-3);max-width:42ch}
.hd-card{grid-column:span 1;padding:24px}
.hd-card h3{font-family:var(--disp);font-size:16px;font-weight:600;letter-spacing:-.015em;margin:14px 0 8px}
.hd-card p{font-size:13.3px;line-height:1.58;color:var(--ink-3)}
.hd-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}
.hd-icon-blue{background:rgba(43,107,228,.1);color:var(--blue)}
.hd-icon-green{background:rgba(23,145,107,.1);color:var(--verify)}
.hd-icon-amber{background:rgba(224,164,43,.14);color:#B8811A}
.hd-icon-slate{background:rgba(44,69,104,.09);color:var(--ink-2)}

/* vastu dial */
.hd-vastu{display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(3,60px);gap:5px;flex:none}
.hd-zone{display:grid;place-items:center;border-radius:7px;background:var(--vellum);
  border:1px solid var(--line);font-size:9.5px;font-family:var(--mono);color:var(--ink-3);
  text-align:center;line-height:1.2;padding:3px;transition:.3s}
.hd-zone.is-core{background:rgba(43,107,228,.08);color:var(--blue)}
.hd-zone.is-live{background:rgba(224,164,43,.16);border-color:var(--brass);color:#8A5F09;
  transform:scale(1.06)}

/* kitchen mini layouts */
.hd-kits{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;flex:none}
.hd-kit{display:flex;flex-direction:column;align-items:center;gap:7px}
.hd-kit span{font-family:var(--mono);font-size:10px;color:var(--ink-3)}
.hd-kit-grid{display:grid;grid-template-columns:repeat(3,15px);grid-template-rows:repeat(3,15px);gap:2px;
  padding:5px;border:1px solid var(--line);border-radius:6px;background:var(--vellum)}
.hd-kit-grid i{border-radius:2px;background:rgba(44,69,104,.08)}
.hd-kit-grid i.on{background:var(--blue)}
.hd-kit:nth-child(2) .hd-kit-grid i.on{background:var(--verify)}
.hd-kit:nth-child(3) .hd-kit-grid i.on{background:var(--brass)}
.hd-kit:nth-child(4) .hd-kit-grid i.on{background:var(--ink-2)}

/* ---------- templates ---------- */
.hd-tmpl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px}
.hd-tmpl{border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;background:var(--paper);
  display:flex;flex-direction:column;transition:transform .22s ease,box-shadow .22s ease}
.hd-tmpl:hover{transform:translateY(-4px);box-shadow:0 22px 44px -24px rgba(12,27,51,.45)}
.hd-tmpl-art{position:relative;background:#0B2743}
.hd-thumb{display:block;width:100%;height:auto}
.hd-tag{position:absolute;top:12px;right:12px;background:rgba(5,24,44,.92);font-family:var(--mono);font-size:10.5px;
  padding:5px 10px;border-radius:5px;border:1px solid;backdrop-filter:blur(6px);
  box-shadow:0 2px 10px rgba(4,20,38,.5)}
.hd-tmpl-body{padding:22px;display:flex;flex-direction:column;gap:9px;flex:1}
.hd-tmpl-body h3{font-family:var(--disp);font-size:18px;font-weight:600;letter-spacing:-.02em}
.hd-tmpl-meta{font-family:var(--mono);font-size:12px;color:var(--brass);display:flex;align-items:center;gap:8px}
.hd-tmpl-meta i{width:14px;height:1px;background:currentColor;display:block}
.hd-tmpl-body p{font-size:13.3px;line-height:1.58;color:var(--ink-3)}
.hd-tmpl-body .hd-btn{margin-top:auto}

/* ---------- 3d band ---------- */
.hd-split{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:52px;align-items:center}
.hd-checks{display:flex;flex-direction:column;gap:11px;margin:26px 0 30px;font-size:14.5px;color:#C5D8EA}
.hd-checks li{display:flex;align-items:center;gap:10px}
.hd-checks svg{color:var(--blue-l);flex:none}
.hd-iso{border:1px solid rgba(127,199,232,.26);border-radius:var(--r-md);overflow:hidden;
  background:rgba(4,24,45,.5);box-shadow:0 30px 60px -30px rgba(0,0,0,.8)}

/* ---------- cta + footer ---------- */
.hd-cta-inner{max-width:680px}
.hd-cta-inner .hd-invert-p{margin:16px auto 30px}
.hd-cta-meta{display:flex;gap:26px;justify-content:center;margin-top:26px;font-size:12.5px;color:#B7CBE6}
.hd-cta-meta span{display:flex;align-items:center;gap:7px}
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
@keyframes hd-draw{to{stroke-dashoffset:0}}
@keyframes hd-pop{from{opacity:0}to{opacity:1}}
@keyframes hd-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes hd-fade{from{opacity:0}to{opacity:1}}
@keyframes hd-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
@keyframes hd-needle{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes hd-sun{0%{transform:rotate(180deg) translateX(38px) rotate(-180deg);opacity:0}
  10%,90%{opacity:1}100%{transform:rotate(360deg) translateX(38px) rotate(-360deg);opacity:0}}

.hd-draw{stroke-dasharray:760;stroke-dashoffset:760;animation:hd-draw .85s cubic-bezier(.4,0,.2,1) both;animation-delay:var(--d,0s)}
.hd-draw-s{stroke-dasharray:120;stroke-dashoffset:120;animation-duration:.5s}
.hd-pop{animation:hd-pop .5s ease both;animation-delay:var(--d,0s)}
.hd-rise{animation:hd-rise .6s cubic-bezier(.22,1,.36,1) both;animation-delay:var(--d,0s)}
.hd-needle{transform-origin:0 0;animation:hd-needle 6s ease-in-out infinite}
.hd-sun{animation:hd-sun 9s linear infinite;transform-origin:0 6px}
[data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
[data-reveal].is-in{opacity:1;transform:none}

/* ---------- responsive ---------- */
@media (max-width:1040px){
  .hd-hero-inner{grid-template-columns:1fr;gap:38px}
  .hd-lede{max-width:60ch}
  .hd-split{grid-template-columns:1fr;gap:34px}
  .hd-bento{grid-template-columns:repeat(2,1fr)}
  .hd-panel-wide{grid-column:span 2}
  .hd-titleblock{grid-template-columns:1fr 1fr 1fr}
  .hd-tb-cell:nth-child(1){grid-column:span 3;border-bottom:1px solid var(--line)}
}
@media (max-width:760px){
  .hd-nav{padding:0 16px;height:58px}
  .hd-nav-links{display:none}
  .hd-brand-name{font-size:15px}
  .hd-pro{display:none}
  .hd-wide-only{display:none}
  .hd-narrow-only{display:inline}
  .hd-nav .hd-btn-sm{padding:8px 13px}
  .hd-sheet-cap{text-align:left}
  .hd-wrap,.hd-sec,.hd-hero{padding-left:18px;padding-right:18px}
  .hd-sec{padding-top:60px;padding-bottom:60px}
  .hd-hero{padding-top:50px}
  .hd-measure{grid-template-columns:repeat(2,1fr)}
  .hd-measure-cell:nth-child(3){border-left:none}
  .hd-measure-cell:nth-child(n+3){border-top:1px solid rgba(127,199,232,.16)}
  .hd-bento{grid-template-columns:1fr}
  .hd-panel-wide{grid-column:span 1;grid-template-columns:1fr;justify-items:start}
  .hd-vastu{grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,56px);width:100%}
  .hd-kits{width:100%}
  .hd-titleblock{grid-template-columns:1fr 1fr}
  .hd-tb-cell:nth-child(1){grid-column:span 2}
  .hd-btn-lg{width:100%}
  .hd-cta-row{flex-direction:column}
}
@media (prefers-reduced-motion:reduce){
  .hd-page *{animation-duration:.01ms !important;animation-iteration-count:1 !important;
    transition-duration:.01ms !important}
  [data-reveal]{opacity:1;transform:none}
  .hd-draw{stroke-dashoffset:0}
}
`;