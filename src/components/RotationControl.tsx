import React, { useState, useEffect } from 'react';
import { RotateCw, RotateCcw, FlipHorizontal } from 'lucide-react';

interface RotationControlProps {
  label?: string;
  angleRad: number;
  onChange: (newAngleRad: number) => void;
  onFlip180?: () => void;
}

export const RotationControl: React.FC<RotationControlProps> = ({
  label = 'Rotation / Orientation',
  angleRad,
  onChange,
  onFlip180,
}) => {
  // Normalize angle to 0° <= deg < 360°
  const rawDeg = Math.round((angleRad * 180) / Math.PI) % 360;
  const currentDeg = rawDeg < 0 ? rawDeg + 360 : rawDeg;

  const [inputVal, setInputVal] = useState<string>(String(currentDeg));

  useEffect(() => {
    setInputVal(String(currentDeg));
  }, [currentDeg]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    const rad = (deg * Math.PI) / 180;
    onChange(rad);
  };

  const handleTextBlur = () => {
    let parsed = parseFloat(inputVal);
    if (isNaN(parsed)) {
      setInputVal(String(currentDeg));
      return;
    }
    parsed = ((Math.round(parsed) % 360) + 360) % 360;
    setInputVal(String(parsed));
    onChange((parsed * Math.PI) / 180);
  };

  const handleRotateStep = (deltaDeg: number) => {
    const newDeg = ((currentDeg + deltaDeg) % 360 + 360) % 360;
    onChange((newDeg * Math.PI) / 180);
  };

  const handleFlip = () => {
    if (onFlip180) {
      onFlip180();
    } else {
      handleRotateStep(180);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
      }}
    >
      {/* Title & Numeric Angle Input */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
          🔄 {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number"
            min={0}
            max={360}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextBlur();
            }}
            style={{
              width: 52,
              textAlign: 'right',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 4px',
              borderRadius: 4,
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>°</span>
        </div>
      </div>

      {/* 360° Continuous Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={currentDeg}
          onChange={handleSliderChange}
          style={{
            flex: 1,
            accentColor: '#2563eb',
            cursor: 'pointer',
            height: 6,
          }}
        />
      </div>

      {/* Action Buttons: ↺ -90°, ↻ +90°, 180° Flip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr', gap: 6 }}>
        <button
          type="button"
          onClick={() => handleRotateStep(-90)}
          title="Rotate 90° Counter-Clockwise (Right to Left)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 0',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} />
          <span>-90°</span>
        </button>

        <button
          type="button"
          onClick={() => handleRotateStep(90)}
          title="Rotate 90° Clockwise (Left to Right)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 0',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <RotateCw size={12} />
          <span>+90°</span>
        </button>

        <button
          type="button"
          onClick={handleFlip}
          title="Flip 180°"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 0',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <FlipHorizontal size={12} />
          <span>180° Flip</span>
        </button>
      </div>

      {/* Preset Angle Buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 45, 90, 180, 270].map((deg) => {
          const isActive = Math.abs(currentDeg - deg) <= 1;
          return (
            <button
              key={deg}
              type="button"
              onClick={() => onChange((deg * Math.PI) / 180)}
              style={{
                flex: 1,
                padding: '3px 0',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
                background: isActive ? '#2563eb' : 'var(--bg-panel)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: isActive ? '1px solid #2563eb' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {deg}°
            </button>
          );
        })}
      </div>
    </div>
  );
};
