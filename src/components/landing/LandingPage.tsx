import React from 'react';
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
  Globe,
  Zap,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { GITHUB_REPO_URL, GITHUB_RELEASES_URL } from '../../core/platform';

interface LandingPageProps {
  onStartDesigning: () => void;
  onNavigateDownload: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDesigning,
  onNavigateDownload,
}) => {
  const features = [
    {
      icon: <Layers size={22} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#bfdbfe',
      title: '100% Feet & Inches Precision',
      description: 'Draw walls, doors, windows, and slabs with exact architectural dimensioning without metric conversion hassle.',
    },
    {
      icon: <Box size={22} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ddd6fe',
      title: 'Real-Time 3D Perspective & Walk',
      description: 'Every 2D wall immediately renders into a full 3D house model. Explore with orbit camera, walk camera, and solar sun study.',
    },
    {
      icon: <Wand2 size={22} color="#059669" />,
      bg: '#ecfdf5',
      border: '#a7f3d0',
      title: 'Smart AI Floor Plan Generator',
      description: 'Type simple natural language instructions like "3 BHK 30x40 with kitchen in SE" — 100% offline with zero API keys required.',
    },
    {
      icon: <ChefHat size={22} color="#ea580c" />,
      bg: '#fff7ed',
      border: '#fed7aa',
      title: 'Modular Kitchen Studio',
      description: 'Design L-shaped, U-shaped, Parallel, and Island cabinetry layouts with cooktops, chimney hoods, sinks, and ovens.',
    },
    {
      icon: <Compass size={22} color="#9333ea" />,
      bg: '#faf5ff',
      border: '#e9d5ff',
      title: 'Vastu Shastra Compliance Engine',
      description: 'Automated 9-zone spatial analysis scoring rooms against traditional energy directions (Ishanya, Agni, Nairutya, Vayavya).',
    },
    {
      icon: <Trees size={22} color="#16a34a" />,
      bg: '#f0fdf4',
      border: '#bbf7d0',
      title: 'Landscape & Site Planning',
      description: 'Configure survey lot boundaries, zoning setbacks, swimming pools, paved driveways, patios, and shade trees.',
    },
    {
      icon: <BarChart3 size={22} color="#0284c7" />,
      bg: '#f0f9ff',
      border: '#bae6fd',
      title: 'Instant BOQ & Cost Estimator',
      description: 'Calculate carpet area, built-up area, masonry volume, plaster, tile takeoff, and construction budgets in ₹ / $.',
    },
    {
      icon: <Printer size={22} color="#475569" />,
      bg: '#f8fafc',
      border: '#e2e8f0',
      title: 'Professional Blueprint Export',
      description: 'Generate high-resolution printable 2D blueprint drawing sheets and PDF documentation for builders and architects.',
    },
  ];

  const templates = [
    {
      title: '✨ 3 BHK Luxury Villa',
      size: '40′ × 50′ (2,000 sq ft)',
      desc: 'Master suite with attached bath, 2 bedrooms, modular kitchen in SE, grand living hall, puja room & dining.',
      tag: 'Most Popular',
      color: '#3b82f6',
    },
    {
      title: '🏠 2 BHK Modern Home',
      size: '30′ × 40′ (1,200 sq ft)',
      desc: 'Optimal urban family layout with master bedroom in SW, guest room, open kitchen, living room & 2 baths.',
      tag: 'Compact & Efficient',
      color: '#10b981',
    },
    {
      title: '🧭 Vastu-Harmonious 3 BHK',
      size: '35′ × 45′ (1,575 sq ft)',
      desc: 'Strict 9-zone Vastu Shastra aligned layout with kitchen in Agni, master in Nairutya, and living in Ishanya.',
      tag: '100% Vastu Aligned',
      color: '#8b5cf6',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#ffffff', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      {/* ─── Top Navbar ─── */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Home size={18} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Home Designer
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: 4,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
              }}
            >
              PRO
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="#features"
            style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 10px' }}
          >
            Features
          </a>
          <a
            href="#templates"
            style={{ fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 10px' }}
          >
            Templates
          </a>
          <button
            onClick={onNavigateDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#0f172a',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              padding: '7px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} />
            <span>Download Desktop</span>
          </button>
          <button
            onClick={onStartDesigning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={14} />
            <span>Start Designing (Free)</span>
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section
        style={{
          padding: '80px 32px 60px',
          maxWidth: 1200,
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: '#15803d',
            marginBottom: 20,
          }}
        >
          <Sparkles size={14} color="#16a34a" />
          <span>New: Inbuilt Smart AI Assistant & Offline Plan Synthesis</span>
        </div>

        <h1
          style={{
            fontSize: 52,
            fontWeight: 850,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: '#0f172a',
            margin: '0 0 20px',
            maxWidth: 900,
          }}
        >
          Architectural Home Design <br />
          <span style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            In Pure Feet & Inches
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: '#475569',
            maxWidth: 720,
            lineHeight: 1.6,
            margin: '0 0 36px',
          }}
        >
          Design your complete home in 2D floor plans and explore in real-time 3D walkthrough.
          Packed with Modular Kitchen Studio, Vastu Compliance Engine, Site Planning, and an Inbuilt AI Plan Assistant.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onStartDesigning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Start Designing for Free</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onNavigateDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '14px 24px',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={16} color="#2563eb" />
            <span>Download for Mac / Windows</span>
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 40,
            fontSize: 13,
            color: '#64748b',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>No Metric Conversion Hassle</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>100% Free & No Sign-Up Required</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>Runs 100% Client-Side / Offline</span>
          </div>
        </div>
      </section>

      {/* ─── Core Features Grid ─── */}
      <section id="features" style={{ padding: '60px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', margin: '0 0 10px' }}>
              Everything You Need To Design A House
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              Professional architectural capabilities simplified for everyone.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {features.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${feat.border}`,
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: feat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{feat.title}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Starter Templates Section ─── */}
      <section id="templates" style={{ padding: '60px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', margin: '0 0 10px' }}>
            Ready-To-Use Architectural Templates
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
            Pick a floor plan and start customizing in seconds.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {templates.map((tmpl, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 24,
                background: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tmpl.color, background: `${tmpl.color}15`, padding: '3px 8px', borderRadius: 4 }}>
                    {tmpl.tag}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{tmpl.size}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{tmpl.title}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>{tmpl.desc}</p>
              </div>

              <button
                onClick={onStartDesigning}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Open in Studio</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Desktop App Download Callout ─── */}
      <section style={{ padding: '60px 32px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#ffffff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            Prefer A Native Desktop Application?
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Download Home Designer PRO for macOS and Windows. 100% offline, GPU-accelerated 3D rendering, and local file management.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
                background: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
              }}
            >
              <Apple size={18} />
              <span>Download for macOS (.dmg)</span>
            </button>

            <button
              onClick={onNavigateDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '12px 24px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <Monitor size={18} />
              <span>Download for Windows (.exe)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: '32px', borderTop: '1px solid #e2e8f0', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Home size={16} color="#2563eb" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Home Designer PRO</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>• 100% Feet & Inches CAD Engine</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>github.com/sahil3785</span>
            </a>
            <button
              onClick={onNavigateDownload}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Download Center
            </button>
            <button
              onClick={onStartDesigning}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Launch Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
