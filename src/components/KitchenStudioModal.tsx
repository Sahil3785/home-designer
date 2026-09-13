import React, { useState, useMemo } from 'react';
import { Project } from '../core/model/types';
import {
  KitchenDesign,
  KitchenLayoutType,
  CountertopMaterial,
  CountertopEdge,
  CabinetFinish,
  ShutterStyle,
  HandleStyle,
  createStraightKitchen,
  createLShapeKitchen,
  createUShapeKitchen,
  createIslandKitchen,
  computeCountertopAreaSqFt,
  computeKitchenCabinetLinearFeet,
  computeKitchenEstimatedCostINR,
  COUNTERTOP_PRESETS,
  CABINET_FINISH_PRESETS,
} from '../core/model/kitchen';
import {
  X,
  ChefHat,
  Sparkles,
  Layers,
  Utensils,
  CheckCircle2,
  Sliders,
  DollarSign,
  Maximize2,
  Trash2,
  Lightbulb,
} from 'lucide-react';

interface KitchenStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onAddKitchen: (kitchen: KitchenDesign) => void;
  onUpdateKitchen?: (kitchen: KitchenDesign) => void;
  onDeleteKitchen?: (kitchenId: string) => void;
}

export type KitchenTab = 'layouts' | 'finishes' | 'countertops' | 'appliances' | 'boq';

export const KitchenStudioModal: React.FC<KitchenStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  onAddKitchen,
  onUpdateKitchen,
  onDeleteKitchen,
}) => {
  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const existingKitchen = activeFloor.kitchens?.[0];

  const [activeTab, setActiveTab] = useState<KitchenTab>('layouts');

  // Working kitchen state
  const [currentKitchen, setCurrentKitchen] = useState<KitchenDesign>(() => {
    if (existingKitchen) return existingKitchen;
    return createStraightKitchen(activeFloor.id, { x: 0, y: 0 }, 10);
  });

  // Calculate live stats
  const countertopSqFt = useMemo(
    () => computeCountertopAreaSqFt(currentKitchen),
    [currentKitchen]
  );
  const linearFeet = useMemo(
    () => computeKitchenCabinetLinearFeet(currentKitchen),
    [currentKitchen]
  );
  const costBOQ = useMemo(
    () => computeKitchenEstimatedCostINR(currentKitchen),
    [currentKitchen]
  );

  if (!isOpen) return null;

  const handleSelectPreset = (type: KitchenLayoutType) => {
    let newKitchen: KitchenDesign;
    const pos = currentKitchen.position;
    switch (type) {
      case 'l_shape':
        newKitchen = createLShapeKitchen(activeFloor.id, pos, 10, 8);
        break;
      case 'u_shape':
        newKitchen = createUShapeKitchen(activeFloor.id, pos, 10, 8, 8);
        break;
      case 'island':
        newKitchen = createIslandKitchen(activeFloor.id, pos, 12, 6);
        break;
      case 'straight':
      default:
        newKitchen = createStraightKitchen(activeFloor.id, pos, 10);
        break;
    }

    newKitchen.cabinetFinish = currentKitchen.cabinetFinish;
    newKitchen.shutterStyle = currentKitchen.shutterStyle;
    newKitchen.handleStyle = currentKitchen.handleStyle;
    newKitchen.countertopMaterial = currentKitchen.countertopMaterial;
    newKitchen.countertopEdge = currentKitchen.countertopEdge;
    newKitchen.hasUnderCabinetLighting = currentKitchen.hasUnderCabinetLighting;

    setCurrentKitchen(newKitchen);
  };

  const handleApplyToPlan = () => {
    if (existingKitchen && onUpdateKitchen) {
      onUpdateKitchen(currentKitchen);
    } else {
      onAddKitchen(currentKitchen);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-medium, #334155)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-medium, #334155)',
            background: 'var(--bg-surface-elevated, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <ChefHat size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Modular Kitchen & Custom Cabinetry Studio
              </h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                  Level: {activeFloor.name}
                </span>
                <span style={{ fontSize: 12, color: '#f97316', fontWeight: 500 }}>
                  • {linearFeet} Rft Run • {countertopSqFt} sq ft Countertop
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '0 24px',
            borderBottom: '1px solid var(--border-medium, #334155)',
            background: 'var(--bg-surface, #1e293b)',
            gap: 24,
          }}
        >
          {(
            [
              { id: 'layouts', label: '1. Layout Presets', icon: <Layers size={14} /> },
              { id: 'finishes', label: '2. Cabinet Finishes & Shutters', icon: <Sparkles size={14} /> },
              { id: 'countertops', label: '3. Countertops & Slabs', icon: <Sliders size={14} /> },
              { id: 'appliances', label: '4. Built-in Appliances', icon: <Utensils size={14} /> },
              { id: 'boq', label: '5. BOQ & Cost Takeoff', icon: <DollarSign size={14} /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 4px',
                fontSize: 13,
                fontWeight: 500,
                color: activeTab === t.id ? '#f97316' : 'var(--text-secondary, #94a3b8)',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #f97316' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* TAB 1: LAYOUT PRESETS */}
          {activeTab === 'layouts' && (
            <div>
              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
                Select an architectural kitchen configuration. The generator will construct modular base units, wall cabinets, sink basins, and cooktops automatically.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  {
                    id: 'straight',
                    title: 'Straight Run Kitchen',
                    dims: "10' Linear Wall",
                    desc: 'Compact single-wall run with integrated sink, 4-burner hob, and overhead cabinets.',
                    icon: '⎯',
                  },
                  {
                    id: 'l_shape',
                    title: 'L-Shape Kitchen',
                    dims: "10' × 8' Corner",
                    desc: 'Classic efficient work triangle layout with perpendicular corner storage.',
                    icon: '⌐',
                  },
                  {
                    id: 'u_shape',
                    title: 'U-Shape Luxury Kitchen',
                    dims: "10' × 8' × 8'",
                    desc: 'Surrounding 3-wall preparation kitchen with maximum counter workspace.',
                    icon: '⊔',
                  },
                  {
                    id: 'island',
                    title: "Chef's Island Kitchen",
                    dims: "12' Run + 6' Island",
                    desc: 'Open-concept show kitchen with central dining/breakfast counter island.',
                    icon: '▭ ⬚',
                  },
                ].map((item) => {
                  const isSelected = currentKitchen.layoutType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPreset(item.id as KitchenLayoutType)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: isSelected ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                        background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: isSelected ? '#f97316' : 'var(--text-secondary, #94a3b8)',
                          marginBottom: 8,
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#f97316' : '#fff' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#f97316', fontWeight: 500, margin: '2px 0 6px 0' }}>
                        {item.dims}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CABINET FINISHES & SHUTTERS */}
          {activeTab === 'finishes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>1. Shutter Finish & Color Palette</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {(Object.keys(CABINET_FINISH_PRESETS) as CabinetFinish[]).map((fin) => {
                    const preset = CABINET_FINISH_PRESETS[fin];
                    const isSelected = currentKitchen.cabinetFinish === fin;
                    return (
                      <div
                        key={fin}
                        onClick={() => setCurrentKitchen((k) => ({ ...k, cabinetFinish: fin }))}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: isSelected ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                          background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: 48,
                            borderRadius: 6,
                            background: preset.color,
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#f97316' : '#fff' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                          ₹{preset.costPerRftINR} / Rft
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>2. Cabinet Shutter Profile</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { id: 'slab', label: 'Contemporary Slab', desc: 'Sleek flat surface' },
                    { id: 'shaker_5piece', label: 'Classic Shaker', desc: '5-piece recessed frame' },
                    { id: 'fluted_grooved', label: 'Architectural Fluted', desc: 'Vertical grooved reeding' },
                    { id: 'handleless_j_pull', label: 'Minimalist J-Pull', desc: 'Continuous bevel grip' },
                  ].map((s) => {
                    const isSelected = currentKitchen.shutterStyle === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setCurrentKitchen((k) => ({ ...k, shutterStyle: s.id as ShutterStyle }))}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: isSelected ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                          background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#f97316' : '#fff' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>3. Hardware Pulls & Handles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { id: 'brushed_brass_bar', label: 'Brushed Brass Bar', color: '#eab308' },
                    { id: 'matte_black_pull', label: 'Matte Black Bar', color: '#1e293b' },
                    { id: 'stainless_steel_t', label: 'Stainless Steel T-Bar', color: '#94a3b8' },
                    { id: 'integrated_j_channel', label: 'Integrated Channel', color: '#64748b' },
                  ].map((h) => {
                    const isSelected = currentKitchen.handleStyle === h.id;
                    return (
                      <div
                        key={h.id}
                        onClick={() => setCurrentKitchen((k) => ({ ...k, handleStyle: h.id as HandleStyle }))}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: isSelected ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                          background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: h.color }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: isSelected ? '#f97316' : '#fff' }}>
                          {h.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COUNTERTOPS & SLABS */}
          {activeTab === 'countertops' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Countertop Slab Material</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                  {(Object.keys(COUNTERTOP_PRESETS) as CountertopMaterial[]).map((mat) => {
                    const preset = COUNTERTOP_PRESETS[mat];
                    const isSelected = currentKitchen.countertopMaterial === mat;
                    return (
                      <div
                        key={mat}
                        onClick={() => setCurrentKitchen((k) => ({ ...k, countertopMaterial: mat }))}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: isSelected ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                          background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: 40,
                            borderRadius: 6,
                            background: preset.color,
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#f97316' : '#fff' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#f97316', fontWeight: 500, marginTop: 2 }}>
                          ₹{preset.costPerSqFtINR} / sq ft
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Countertop Edge Profile</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['square', 'beveled', 'bullnose', 'waterfall'] as CountertopEdge[]).map((e) => (
                      <button
                        key={e}
                        onClick={() => setCurrentKitchen((k) => ({ ...k, countertopEdge: e }))}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: currentKitchen.countertopEdge === e ? '2px solid #f97316' : '1px solid var(--border-medium, #334155)',
                          background: currentKitchen.countertopEdge === e ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface-elevated, #0f172a)',
                          color: currentKitchen.countertopEdge === e ? '#f97316' : '#fff',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {e} Edge
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Architectural Options</h4>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated, #0f172a)',
                      border: '1px solid var(--border-medium, #334155)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={currentKitchen.hasUnderCabinetLighting}
                      onChange={(e) => setCurrentKitchen((k) => ({ ...k, hasUnderCabinetLighting: e.target.checked }))}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={16} color="#fbbf24" />
                      <span style={{ fontSize: 13 }}>Under-Cabinet LED Task Strip Glow</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPLIANCES */}
          {activeTab === 'appliances' && (
            <div>
              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
                Installed built-in kitchen appliances with precise 3D geometry, cutouts, and electrical connections.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {currentKitchen.appliances.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'var(--bg-surface-elevated, #0f172a)',
                      border: '1px solid var(--border-medium, #334155)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(249, 115, 22, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f97316',
                        }}
                      >
                        <Utensils size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', textTransform: 'capitalize' }}>
                          {app.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BOQ & COST TAKEOFF */}
          {activeTab === 'boq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--bg-surface-elevated, #0f172a)',
                    border: '1px solid var(--border-medium, #334155)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>Cabinetry Length</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                    {linearFeet} <span style={{ fontSize: 14, fontWeight: 400 }}>Rft</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#f97316', marginTop: 4 }}>
                    ₹{costBOQ.cabinetsINR.toLocaleString('en-IN')}
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--bg-surface-elevated, #0f172a)',
                    border: '1px solid var(--border-medium, #334155)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>Countertop Surface</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                    {countertopSqFt} <span style={{ fontSize: 14, fontWeight: 400 }}>sq ft</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#f97316', marginTop: 4 }}>
                    ₹{costBOQ.countertopINR.toLocaleString('en-IN')}
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--bg-surface-elevated, #0f172a)',
                    border: '1px solid var(--border-medium, #334155)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>Total Estimated BOQ</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                    ₹{costBOQ.totalINR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                    Includes millwork, stone & fixtures
                  </div>
                </div>
              </div>

              {/* Table of Components */}
              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--border-medium, #334155)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-elevated, #0f172a)', borderBottom: '1px solid var(--border-medium, #334155)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Specification Component</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Selection</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600 }}>Rate</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600 }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 14px' }}>Modular Cabinetry Carcass & Shutters</td>
                      <td style={{ padding: '10px 14px', color: '#f97316' }}>{CABINET_FINISH_PRESETS[currentKitchen.cabinetFinish]?.name}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>₹{CABINET_FINISH_PRESETS[currentKitchen.cabinetFinish]?.costPerRftINR}/Rft</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>₹{costBOQ.cabinetsINR.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 14px' }}>Solid Countertop Slab ({currentKitchen.countertopEdge} edge)</td>
                      <td style={{ padding: '10px 14px', color: '#f97316' }}>{COUNTERTOP_PRESETS[currentKitchen.countertopMaterial]?.name}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>₹{COUNTERTOP_PRESETS[currentKitchen.countertopMaterial]?.costPerSqFtINR}/sq ft</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>₹{costBOQ.countertopINR.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 14px' }}>Fitted Appliances & Sink Package</td>
                      <td style={{ padding: '10px 14px' }}>{currentKitchen.appliances.length} Built-in Units</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>Package</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>₹{costBOQ.appliancesINR.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderTop: '1px solid var(--border-medium, #334155)',
            background: 'var(--bg-surface-elevated, #0f172a)',
          }}
        >
          <div>
            {existingKitchen && onDeleteKitchen && (
              <button
                onClick={() => {
                  onDeleteKitchen(existingKitchen.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #ef444440',
                  background: '#ef444415',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Remove Kitchen</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-medium, #334155)',
                background: 'transparent',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyToPlan}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{existingKitchen ? 'Save Kitchen Design' : 'Apply Kitchen to Floor Plan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
