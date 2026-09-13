import React, { useState } from 'react';
import { Roof, RoofType, Wall } from '../core/model/types';
import { Sixteenths, feetInchesToSixteenths } from '../core/units';
import { FeetInchesInput } from './FeetInchesInput';
import { Home, X, Trash2 } from 'lucide-react';
import { createDefaultRoof } from '../core/model/roof';

interface RoofModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: string;
  existingRoof?: Roof;
  walls: Wall[];
  onSaveRoof: (roof: Roof | undefined) => void;
}

export const RoofModal: React.FC<RoofModalProps> = ({
  isOpen,
  onClose,
  floorId,
  existingRoof,
  walls,
  onSaveRoof,
}) => {
  if (!isOpen) return null;

  const defaultR = existingRoof || createDefaultRoof(floorId, 'gable');

  const [type, setType] = useState<RoofType>(defaultR.type);
  const [pitch, setPitch] = useState<number>(defaultR.pitch);
  const [overhang, setOverhang] = useState<Sixteenths>(defaultR.overhang);
  const [ridgeAxis, setRidgeAxis] = useState<'x' | 'y'>(defaultR.ridgeAxis);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRoof({
      id: defaultR.id,
      floorId,
      type,
      pitch,
      overhang,
      thickness: feetInchesToSixteenths(0, 6),
      ridgeAxis,
      visible: true,
    });
    onClose();
  };

  const handleDelete = () => {
    onSaveRoof(undefined);
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
            <Home size={18} color="var(--accent-amber)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              House Roof Generator
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
        <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Roof Style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Roof Architecture Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'gable' as RoofType, label: 'Gable Roof', desc: 'Classic 2-slope triangular ridge' },
                { id: 'hip' as RoofType, label: 'Hip Roof', desc: '4-slope pyramid incline' },
                { id: 'shed' as RoofType, label: 'Shed Roof', desc: 'Modern single monopitch' },
                { id: 'flat' as RoofType, label: 'Flat Deck', desc: 'Modern parapet roof deck' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setType(r.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: type === r.id ? '2px solid var(--accent-blue)' : '1px solid var(--border-medium)',
                    background: type === r.id ? '#eff6ff' : 'var(--bg-surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: type === r.id ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pitch & Overhang */}
          {type !== 'flat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Roof Slope Pitch ({pitch}/12)
                </label>
                <select
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-medium)',
                    fontSize: 12,
                  }}
                >
                  <option value={3}>3/12 (Low slope ~14°)</option>
                  <option value={4}>4/12 (Standard ~18.4°)</option>
                  <option value={6}>6/12 (Standard ~26.6°)</option>
                  <option value={8}>8/12 (Medium steep ~33.7°)</option>
                  <option value={10}>10/12 (Steep ~39.8°)</option>
                  <option value={12}>12/12 (45° pitch)</option>
                </select>
              </div>

              <FeetInchesInput
                label="Eave Overhang"
                value={overhang}
                onChange={setOverhang}
                min={0}
                max={576}
              />
            </div>
          )}

          {/* Ridge Axis for Gable / Shed */}
          {(type === 'gable' || type === 'shed') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Ridge Line Orientation
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ridgeAxis"
                    checked={ridgeAxis === 'x'}
                    onChange={() => setRidgeAxis('x')}
                  />
                  <span>Horizontal (East-West axis)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ridgeAxis"
                    checked={ridgeAxis === 'y'}
                    onChange={() => setRidgeAxis('y')}
                  />
                  <span>Vertical (North-South axis)</span>
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            {existingRoof ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Remove Roof</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
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
                  padding: '7px 18px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--accent-blue)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {existingRoof ? 'Update Roof' : 'Generate Roof'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
