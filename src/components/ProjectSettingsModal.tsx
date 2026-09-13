import React, { useState } from 'react';
import { ProjectSettings } from '../core/model/types';
import { Sixteenths, feetInchesToSixteenths } from '../core/units';
import { FeetInchesInput } from './FeetInchesInput';
import { Settings2, Check, X } from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  settings: ProjectSettings;
  onSave: (patch: Partial<ProjectSettings>) => void;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
}) => {
  const [ceilingHeight, setCeilingHeight] = useState<Sixteenths>(
    settings.defaultCeilingHeight ?? feetInchesToSixteenths(10, 0)
  );
  const [extWallThickness, setExtWallThickness] = useState<Sixteenths>(
    settings.defaultExteriorWallThickness ?? feetInchesToSixteenths(0, 9)
  );
  const [intWallThickness, setIntWallThickness] = useState<Sixteenths>(
    settings.defaultInteriorWallThickness ?? 72 // 4.5"
  );
  const [doorHeight, setDoorHeight] = useState<Sixteenths>(
    settings.defaultDoorHeight ?? feetInchesToSixteenths(7, 0)
  );
  const [doorWidth, setDoorWidth] = useState<Sixteenths>(
    settings.defaultDoorWidth ?? feetInchesToSixteenths(3, 0)
  );
  const [windowHeight, setWindowHeight] = useState<Sixteenths>(
    settings.defaultWindowHeight ?? feetInchesToSixteenths(4, 0)
  );
  const [windowSill, setWindowSill] = useState<Sixteenths>(
    settings.defaultWindowSill ?? feetInchesToSixteenths(2, 6)
  );
  const [ventSill, setVentSill] = useState<Sixteenths>(
    settings.defaultVentilatorSill ?? feetInchesToSixteenths(6, 6)
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      defaultCeilingHeight: ceilingHeight,
      defaultExteriorWallThickness: extWallThickness,
      defaultInteriorWallThickness: intWallThickness,
      defaultDoorHeight: doorHeight,
      defaultDoorWidth: doorWidth,
      defaultWindowHeight: windowHeight,
      defaultWindowSill: windowSill,
      defaultVentilatorSill: ventSill,
    });
    onClose();
  };

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
          width: 480,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.4)',
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
              <Settings2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Architectural Defaults & Dimensions
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Configure standard feet/inches dimensions for walls and openings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ceiling Height */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Default Ceiling Height
            </label>
            <FeetInchesInput
              value={ceilingHeight}
              onChange={setCeilingHeight}
              style={{ width: '100%', padding: '6px 10px' }}
            />
          </div>

          {/* Wall Thicknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Exterior Wall Thickness
              </label>
              <FeetInchesInput
                value={extWallThickness}
                onChange={setExtWallThickness}
                style={{ width: '100%', padding: '6px 10px' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Common: 9"</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Interior Partition Thickness
              </label>
              <FeetInchesInput
                value={intWallThickness}
                onChange={setIntWallThickness}
                style={{ width: '100%', padding: '6px 10px' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Common: 4.5"</span>
            </div>
          </div>

          {/* Doors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Default Door Width
              </label>
              <FeetInchesInput
                value={doorWidth}
                onChange={setDoorWidth}
                style={{ width: '100%', padding: '6px 10px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Default Door Height
              </label>
              <FeetInchesInput
                value={doorHeight}
                onChange={setDoorHeight}
                style={{ width: '100%', padding: '6px 10px' }}
              />
            </div>
          </div>

          {/* Windows & Ventilator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Window Sill Elevation
              </label>
              <FeetInchesInput
                value={windowSill}
                onChange={setWindowSill}
                style={{ width: '100%', padding: '6px 10px' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Standard: 2' 6"</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Ventilator Sill Elevation
              </label>
              <FeetInchesInput
                value={ventSill}
                onChange={setVentSill}
                style={{ width: '100%', padding: '6px 10px' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>High: 6' 6"</span>
            </div>
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
            onClick={onClose}
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
            onClick={handleSave}
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
            Save Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
