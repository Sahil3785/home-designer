import React from 'react';
import { Point2D, Project } from '../core/model/types';
import { Sixteenths, formatFeetInches } from '../core';
import { Crosshair, Magnet, Layers, ZoomIn, Ruler } from 'lucide-react';

interface StatusBarProps {
  cursorCoords: Point2D | null;
  snapGrid: Sixteenths;
  project: Project;
  zoom: number;
  onResetZoom: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorCoords,
  snapGrid,
  project,
  zoom,
  onResetZoom,
}) => {
  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];

  return (
    <footer
      style={{
        height: 28,
        background: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: 11,
        color: 'var(--text-secondary)',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Left: Cursor HUD in feet & inches */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crosshair size={13} color="var(--accent-blue)" />
          {cursorCoords ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }}>
              X: <strong>{formatFeetInches(cursorCoords.x)}</strong> &nbsp; Y:{' '}
              <strong>{formatFeetInches(cursorCoords.y)}</strong>
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Ready</span>
          )}
        </div>

        <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />

        {/* Snap Grid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Magnet size={13} color="var(--accent-amber)" />
          <span>Snap: </span>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {formatFeetInches(snapGrid)}
          </strong>
        </div>

        <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />

        {/* Active Floor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Layers size={13} color="var(--accent-emerald)" />
          <span>Level: </span>
          <strong style={{ color: 'var(--text-primary)' }}>{activeFloor.name}</strong>
          <span style={{ color: 'var(--text-muted)' }}>
            ({formatFeetInches(activeFloor.elevation)})
          </span>
        </div>
      </div>

      {/* Right: Units & Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Units System */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title="Fixed internal 1/16th inch integer arithmetic">
          <Ruler size={13} color="var(--accent-blue)" />
          <span>Units: </span>
          <strong style={{ color: 'var(--accent-blue)' }}>Feet & Inches (1/16")</strong>
        </div>

        <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ZoomIn size={13} />
          <button
            onClick={onResetZoom}
            title="Click to reset zoom to 100%"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-primary)',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>
    </footer>
  );
};

