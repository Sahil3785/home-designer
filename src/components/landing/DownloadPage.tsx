import React from 'react';
import {
  Apple,
  Monitor,
  Globe,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HardDrive,
  Home,
  ExternalLink,
} from 'lucide-react';
import {
  getClientOS,
  GITHUB_REPO_URL,
  GITHUB_RELEASES_URL,
  DIRECT_MAC_DMG_DOWNLOAD,
  GITHUB_WIN_EXE_DOWNLOAD,
} from '../../core/platform';

interface DownloadPageProps {
  onBackToHome: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({
  onBackToHome,
}) => {
  const currentOS = getClientOS();

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      {/* ─── Top Navbar ─── */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <button
          onClick={onBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Home size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Home Designer PRO</span>
        </div>

        <div style={{ width: 100 }} />
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#2563eb',
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={14} />
            <span>Official Desktop Releases (v1.0.0)</span>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 850, letterSpacing: '-0.02em', color: '#0f172a', margin: '0 0 14px' }}>
            Download Home Designer PRO
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Choose your operating system below to install the native desktop application with full offline support and GPU acceleration.
          </p>
        </div>

        {/* ─── Download Cards Grid ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          {/* macOS Card */}
          <div
            style={{
              background: '#ffffff',
              border: currentOS === 'mac' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 32,
              boxShadow: currentOS === 'mac' ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {currentOS === 'mac' && (
              <span
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 24,
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                }}
              >
                Detected for your Mac
              </span>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Apple size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>macOS</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Apple Silicon (M1/M2/M3/M4) & Intel</span>
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Native ARM64 & x64 DMG Installer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Size: ~8.8 MB (Lightweight & Fast)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Requires macOS 11.0 Big Sur or later</span>
                </div>
              </div>
            </div>

            <div>
              <a
                href={DIRECT_MAC_DMG_DOWNLOAD}
                download="HomeDesigner_1.0.0_aarch64.dmg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              >
                <Download size={16} />
                <span>Download .DMG for Mac</span>
              </a>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                Open DMG & drag HomeDesigner.app to Applications
              </div>
            </div>
          </div>

          {/* Windows Card */}
          <div
            style={{
              background: '#ffffff',
              border: currentOS === 'windows' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 32,
              boxShadow: currentOS === 'windows' ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {currentOS === 'windows' && (
              <span
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 24,
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                }}
              >
                Detected for your PC
              </span>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Monitor size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Windows</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>64-bit Windows 10 & Windows 11</span>
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Standard MSI / EXE Installer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Size: ~10 MB (Standalone Executable)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Requires Windows 10 (64-bit) or later</span>
                </div>
              </div>
            </div>

            <div>
              <a
                href={GITHUB_WIN_EXE_DOWNLOAD}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              >
                <Download size={16} />
                <span>Download .MSI / .EXE for Windows</span>
              </a>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                Run setup wizard and launch from Desktop / Start
              </div>
            </div>
          </div>
        </div>

        {/* ─── Native App Performance Features ─── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>100% Offline & GPU Accelerated</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Runs completely on your computer with zero internet requirement, full local file privacy, and instant 3D hardware rendering.
              </p>
            </div>
          </div>
        </div>

        {/* ─── GitHub Releases Hub ─── */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          <span>Looking for previous releases or source code? View all packages on </span>
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>GitHub Releases</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </main>
    </div>
  );
};
