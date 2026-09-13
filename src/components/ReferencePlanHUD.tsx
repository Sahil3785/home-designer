import React from 'react';
import { ReferencePlan } from '../core/model/types';
import { Eye, EyeOff, Lock, Unlock, Ruler, Trash2, Crosshair } from 'lucide-react';

interface ReferencePlanHUDProps {
  plan: ReferencePlan | undefined;
  isCalibrating: boolean;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onOpacityChange: (opacity: number) => void;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onResetOrigin: () => void;
  onRemovePlan: () => void;
}

export const ReferencePlanHUD: React.FC<ReferencePlanHUDProps> = ({
  plan,
  isCalibrating,
  onToggleVisibility,
  onToggleLock,
  onOpacityChange,
  onStartCalibration,
  onCancelCalibration,
  onResetOrigin,
  onRemovePlan,
}) => {
  if (!plan) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(26, 29, 38, 0.92)',
        backdropFilter: 'blur(10px)',
        border: isCalibrating ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '6px 12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        zIndex: 45,
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
    >
      {/* File Badge & Calibration State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        <span
          style={{
            maxWidth: 130,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
          title={plan.fileName}
        >
          📄 {plan.fileName}
        </span>
        {plan.isCalibrated ? (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              fontWeight: 600,
            }}
          >
            ✓ Calibrated
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#facc15',
              fontWeight: 600,
            }}
          >
            ⚠️ Not Calibrated
          </span>
        )}
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

      {/* Visibility Toggle */}
      <button
        onClick={onToggleVisibility}
        title={plan.isVisible ? 'Hide Reference Image' : 'Show Reference Image'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: plan.isVisible ? 'var(--bg-surface)' : 'transparent',
          color: plan.isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        {plan.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        <span style={{ fontSize: 11 }}>{plan.isVisible ? 'Visible' : 'Hidden'}</span>
      </button>

      {/* Opacity Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Opacity:</span>
        <input
          type="range"
          min="10"
          max="100"
          value={Math.round(plan.opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          style={{
            width: 70,
            height: 4,
            accentColor: 'var(--accent-blue)',
            cursor: 'pointer',
          }}
          title={`Trace image opacity: ${Math.round(plan.opacity * 100)}%`}
        />
        <span style={{ fontSize: 11, fontWeight: 600, minWidth: 26 }}>
          {Math.round(plan.opacity * 100)}%
        </span>
      </div>

      {/* Lock Toggle */}
      <button
        onClick={onToggleLock}
        title={
          plan.isLocked
            ? 'Layer Locked: Mouse clicks pass directly to CAD tools (Wall, Door, Stair) for tracing'
            : 'Layer Unlocked: Click to lock so you can trace without accidentally moving the image'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          border: plan.isLocked ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-subtle)',
          background: plan.isLocked ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          color: plan.isLocked ? 'var(--accent-blue)' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        {plan.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        <span style={{ fontSize: 11 }}>{plan.isLocked ? 'Locked (Trace Mode)' : 'Unlocked'}</span>
      </button>

      <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

      {/* Calibrate Button */}
      {isCalibrating ? (
        <button
          onClick={onCancelCalibration}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          Cancel Calibration
        </button>
      ) : (
        <button
          onClick={onStartCalibration}
          title="Click two points along a known dimension (e.g. 22' 0&quot;) to calibrate scale"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: plan.isCalibrated ? 'var(--accent-blue)' : '#eab308',
            color: plan.isCalibrated ? '#fff' : '#000',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          <Ruler size={14} />
          {plan.isCalibrated ? 'Recalibrate Scale' : 'Calibrate Scale'}
        </button>
      )}

      {/* Align to Origin */}
      <button
        onClick={onResetOrigin}
        title="Align reference image center to CAD (0,0)"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Crosshair size={14} />
      </button>

      {/* Delete / Remove */}
      <button
        onClick={onRemovePlan}
        title="Remove reference plan image"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
