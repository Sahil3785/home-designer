import React, { useState } from 'react';
import { FloorStyle } from '../core/model/textures';

interface RenderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lightingMode: 'daylight' | 'golden' | 'night';
  onChangeLightingMode: (mode: 'daylight' | 'golden' | 'night') => void;
  floorStyle: FloorStyle;
  onChangeFloorStyle: (style: FloorStyle) => void;
  onCaptureRender: (resolution: '1080p' | '4k' | '8k', settings: RenderSettings) => Promise<string | null>;
}

export interface RenderSettings {
  exposure: number;
  sunIntensity: number;
  warmth: number;
  contrast: number;
}

export const RenderStudioModal: React.FC<RenderStudioModalProps> = ({
  isOpen,
  onClose,
  lightingMode,
  onChangeLightingMode,
  floorStyle,
  onChangeFloorStyle,
  onCaptureRender,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '4k' | '8k'>('4k');
  const [isRendering, setIsRendering] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);

  const [settings, setSettings] = useState<RenderSettings>({
    exposure: 1.1,
    sunIntensity: 1.8,
    warmth: 1.0,
    contrast: 1.05,
  });

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(15);
    try {
      // Simulate multi-pass progressive super-sampling feedback
      const timer1 = setTimeout(() => setRenderProgress(45), 200);
      const timer2 = setTimeout(() => setRenderProgress(80), 500);

      const url = await onCaptureRender(resolution, settings);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setRenderProgress(100);

      if (url) {
        setRenderedImageUrl(url);
      }
    } catch (err) {
      console.error('Render failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedImageUrl) return;
    const a = document.createElement('a');
    a.href = renderedImageUrl;
    a.download = `HomeDesigner_${resolution.toUpperCase()}_Render_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 25, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRendering) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #ec4899, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              }}
            >
              ✨
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>
                8K Architectural Ultra-Realistic Render Studio
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                High-end physically based ray-tracing style supersampling up to 7680 × 4320
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRendering}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 22,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Controls Column */}
          <div
            style={{
              width: 380,
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Resolution Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                🎯 Output Master Resolution
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id: '1080p', label: '1080p', sub: '1920 × 1080' },
                  { id: '4k', label: '4K UHD', sub: '3840 × 2160' },
                  { id: '8k', label: '8K Master', sub: '7680 × 4320' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setResolution(r.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border:
                        resolution === r.id
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      background:
                        resolution === r.id
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                      color: resolution === r.id ? '#38bdf8' : '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting & Sun Atmosphere */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                ☀️ Lighting & Time-of-Day Atmosphere
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id: 'daylight', label: 'Daylight', icon: '☀️', sub: 'Bright Crisp' },
                  { id: 'golden', label: 'Golden Hour', icon: '🌅', sub: 'Warm Sunset' },
                  { id: 'night', label: 'Luxury Night', icon: '🌙', sub: '3000K LED' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onChangeLightingMode(l.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border:
                        lightingMode === l.id
                          ? '2px solid #f59e0b'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      background:
                        lightingMode === l.id
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                      color: lightingMode === l.id ? '#f59e0b' : '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{l.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 12, marginTop: 4 }}>{l.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{l.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Floor Finish Style */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                🏛️ Luxury Flooring Finish
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id: 'oak', label: 'White Oak', icon: '🪵', sub: 'Herringbone' },
                  { id: 'marble', label: 'Calacatta', icon: '🏛️', sub: 'Gold Marble' },
                  { id: 'walnut', label: 'Walnut', icon: '🍂', sub: 'Smoked Wood' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChangeFloorStyle(f.id as any)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border:
                        floorStyle === f.id
                          ? '2px solid #10b981'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      background:
                        floorStyle === f.id
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                      color: floorStyle === f.id ? '#10b981' : '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14 }}>{f.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 11, marginTop: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{f.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Tuning Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>Camera Exposure</span>
                  <span style={{ color: '#fff' }}>{settings.exposure.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="2.0"
                  step="0.05"
                  value={settings.exposure}
                  onChange={(e) => setSettings({ ...settings, exposure: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>Sunlight / Sky Luminance</span>
                  <span style={{ color: '#fff' }}>{settings.sunIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.sunIntensity}
                  onChange={(e) => setSettings({ ...settings, sunIntensity: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>Color Warmth (White Balance)</span>
                  <span style={{ color: '#fff' }}>{settings.warmth.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.02"
                  value={settings.warmth}
                  onChange={(e) => setSettings({ ...settings, warmth: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>
            </div>

            {/* Action Render Button */}
            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleStartRender}
                disabled={isRendering}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: isRendering
                    ? '#334155'
                    : 'linear-gradient(135deg, #2563eb, #7c3aed, #db2777)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: isRendering ? 'not-allowed' : 'pointer',
                  boxShadow: isRendering ? 'none' : '0 6px 20px rgba(124, 58, 237, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isRendering ? (
                  <>
                    <span>⏳ Rendering {resolution.toUpperCase()} ({renderProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <span>📸 Render {resolution.toUpperCase()} Master</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Preview Viewport */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#020617',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              position: 'relative',
            }}
          >
            {renderedImageUrl ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#000',
                  }}
                >
                  <img
                    src={renderedImageUrl}
                    alt="Rendered architectural master"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    ✓ <strong>{resolution.toUpperCase()} Master Generated</strong> — Ready for high-resolution presentation.
                  </div>
                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#10b981',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <span>💾 Download Master PNG</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 360, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#cbd5e1' }}>
                  Ready to Capture Architectural Master
                </h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  Adjust camera position in the 3D viewport, choose your preferred lighting & flooring, then click{' '}
                  <strong style={{ color: '#38bdf8' }}>Render {resolution.toUpperCase()} Master</strong> above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
