import React, { useState } from 'react';
import { Sixteenths, feetInchesToSixteenths } from '../core/units';
import { FeetInchesInput } from './FeetInchesInput';
import { Floor } from '../core/model/types';
import { Layers, X, Copy } from 'lucide-react';

interface AddFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  onAddFloor: (options: {
    name: string;
    ceilingHeight: Sixteenths;
    cloneWallsFromFloorId?: string;
  }) => void;
}

export const AddFloorModal: React.FC<AddFloorModalProps> = ({
  isOpen,
  onClose,
  floors,
  onAddFloor,
}) => {
  if (!isOpen) return null;

  const nextIndex = floors.length;
  const defaultNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Attic'];
  const suggestedName = nextIndex < defaultNames.length ? defaultNames[nextIndex] : `Level ${nextIndex + 1}`;

  const [name, setName] = useState(suggestedName);
  const [ceilingHeight, setCeilingHeight] = useState<Sixteenths>(feetInchesToSixteenths(9, 0));
  const [cloneWalls, setCloneWalls] = useState(true);
  const [selectedSourceFloorId, setSelectedSourceFloorId] = useState(
    floors[floors.length - 1]?.id || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFloor({
      name: name.trim() || suggestedName,
      ceilingHeight,
      cloneWallsFromFloorId: cloneWalls ? selectedSourceFloorId : undefined,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 440,
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--border-medium)',
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
            background: 'var(--bg-panel-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Add New Floor Level
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Floor Level Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. First Floor, Master Suite"
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-medium)',
                fontSize: 13,
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FeetInchesInput
              label="Ceiling Height"
              value={ceilingHeight}
              onChange={setCeilingHeight}
              min={192}
              max={3840}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Standard residential ceiling height is 9' 0" (108 inches).
            </span>
          </div>

          {/* Clone Walls Option */}
          {floors.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 12,
                borderRadius: 8,
                background: 'var(--bg-panel-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={cloneWalls}
                  onChange={(e) => setCloneWalls(e.target.checked)}
                />
                <span>Clone exterior walls for load-bearing alignment</span>
              </label>

              {cloneWalls && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 24 }}>
                  <Copy size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Copy from:</span>
                  <select
                    value={selectedSourceFloorId}
                    onChange={(e) => setSelectedSourceFloorId(e.target.value)}
                    style={{
                      fontSize: 12,
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {floors.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                background: 'var(--bg-panel-secondary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--accent-blue)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Add Floor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
