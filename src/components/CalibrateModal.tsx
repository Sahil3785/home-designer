import React, { useState } from 'react';
import { Sixteenths, feetInchesToSixteenths, formatFeetInches } from '../core/units';
import { FeetInchesInput } from './FeetInchesInput';
import { Ruler, Check, X } from 'lucide-react';

interface CalibrateModalProps {
  isOpen: boolean;
  pixelDistance: number;
  onApply: (knownDistance: Sixteenths) => void;
  onCancel: () => void;
}

export const CalibrateModal: React.FC<CalibrateModalProps> = ({
  isOpen,
  pixelDistance,
  onApply,
  onCancel,
}) => {
  // Default to 22' 0" (4224 sixteenths), standard residential plot width
  const [targetDistance, setTargetDistance] = useState<Sixteenths>(
    feetInchesToSixteenths(22, 0)
  );

  if (!isOpen) return null;

  const inchesPerPixel = pixelDistance > 0 ? (targetDistance / 16) / pixelDistance : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 440,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Ruler size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Calibrate Reference Plan Scale
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Match 2 picked points to a known real-world measurement
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Measured distance between your 2 points:{' '}
            <strong style={{ color: 'var(--accent-blue)' }}>
              {Math.round(pixelDistance)} image pixels
            </strong>
            .
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              Enter the exact dimension from the plan drawing (e.g. <code>22' 0"</code> overall width or <code>45' 0"</code> length).
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Known Real-World Dimension (Feet & Inches)
            </label>
            <FeetInchesInput
              value={targetDistance}
              onChange={setTargetDistance}
              style={{
                fontSize: 14,
                padding: '8px 12px',
                width: '100%',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Quick presets */}
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Common Dimension Presets:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: `22' 0" (Plot Width)`, val: feetInchesToSixteenths(22, 0) },
                { label: `45' 0" (Plot Length)`, val: feetInchesToSixteenths(45, 0) },
                { label: `30' 0"`, val: feetInchesToSixteenths(30, 0) },
                { label: `50' 0"`, val: feetInchesToSixteenths(50, 0) },
                { label: `12' 0" (Room Span)`, val: feetInchesToSixteenths(12, 0) },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTargetDistance(p.val)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    borderRadius: 'var(--radius-sm)',
                    background: targetDistance === p.val ? 'var(--accent-blue)' : 'var(--bg-surface)',
                    color: targetDistance === p.val ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Computed scale summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Calibrated Scale Ratio:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              1 pixel ≈ {inchesPerPixel.toFixed(3)} inches
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--bg-surface)',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(targetDistance)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent-blue)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Check size={16} />
            Apply Calibration ({formatFeetInches(targetDistance)})
          </button>
        </div>
      </div>
    </div>
  );
};
