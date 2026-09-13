import React, { useRef } from 'react';
import {
  MousePointer,
  Hand,
  PenTool,
  DoorOpen,
  AppWindow,
  Ruler,
  Trash2,
  Magnet,
  Grid,
  Building2,
  TrendingUp,
  Home,
  Armchair,
  Wind,
  FileImage,
  Zap,
  Trees,
} from 'lucide-react';
import { Sixteenths, SNAP_PRESETS } from '../core/units';
import { SymbolType, MEP_CATALOG } from '../core/model/mep';

export type CADTool =
  | 'select'
  | 'pan'
  | 'wall'
  | 'door'
  | 'window'
  | 'ventilator'
  | 'column'
  | 'stair'
  | 'roof'
  | 'flooring'
  | 'furniture'
  | 'mep'
  | 'site'
  | 'measure';

interface Toolbar2DProps {
  activeTool: CADTool;
  onToolChange: (tool: CADTool) => void;
  selectedWallId: string | null;
  selectedStairId?: string | null;
  selectedColumnId?: string | null;
  selectedFurnitureId?: string | null;
  selectedSymbolId?: string | null;
  selectedOutdoorFeatureId?: string | null;
  onDeleteSelected: () => void;
  activeThickness: Sixteenths;
  onThicknessChange: (thickness: Sixteenths) => void;
  snapGrid: Sixteenths;
  onSnapGridChange: (snap: Sixteenths) => void;
  orthogonalSnap: boolean;
  onOrthogonalSnapToggle: () => void;
  onImportReferencePlan?: (file: File) => void;
  onOpenFurnitureCatalog?: () => void;
  onOpenFlooringStudio?: () => void;
  onOpenSiteModal?: () => void;
  activeSymbolType?: SymbolType;
  onSymbolTypeChange?: (type: SymbolType) => void;
}

export const Toolbar2D: React.FC<Toolbar2DProps> = ({
  activeTool,
  onToolChange,
  selectedWallId,
  selectedStairId,
  selectedColumnId,
  selectedFurnitureId,
  selectedSymbolId,
  selectedOutdoorFeatureId,
  onDeleteSelected,
  activeThickness,
  onThicknessChange,
  snapGrid,
  onSnapGridChange,
  orthogonalSnap,
  onOrthogonalSnapToggle,
  onImportReferencePlan,
  onOpenFurnitureCatalog,
  onOpenFlooringStudio,
  onOpenSiteModal,
  activeSymbolType,
  onSymbolTypeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSelection = !!(
    selectedWallId ||
    selectedStairId ||
    selectedColumnId ||
    selectedFurnitureId ||
    selectedSymbolId ||
    selectedOutdoorFeatureId
  );

  const navTools: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select Object', icon: <MousePointer size={16} />, shortcut: 'V' },
    { id: 'pan', label: 'Pan / Hand', icon: <Hand size={16} />, shortcut: 'H' },
  ];

  const archTools: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'wall', label: 'Draw Wall', icon: <PenTool size={16} />, shortcut: 'W' },
    { id: 'door', label: 'Insert Door', icon: <DoorOpen size={16} />, shortcut: 'D' },
    { id: 'window', label: 'Insert Window', icon: <AppWindow size={16} />, shortcut: 'I' },
    { id: 'ventilator', label: 'High Ventilator', icon: <Wind size={16} />, shortcut: 'T' },
    { id: 'column', label: 'Add Column', icon: <Building2 size={16} />, shortcut: 'C' },
    { id: 'stair', label: 'Insert Staircase', icon: <TrendingUp size={16} />, shortcut: 'S' },
    { id: 'roof', label: 'Roof Generator', icon: <Home size={16} />, shortcut: 'R' },
  ];

  const interiorTools: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'flooring', label: 'Flooring Studio (Tiles/Marble/PVC/Matte)', icon: <Grid size={16} />, shortcut: 'L' },
    { id: 'furniture', label: 'Furniture & Fixtures', icon: <Armchair size={16} />, shortcut: 'F' },
    { id: 'mep', label: 'MEP Electrical & Plumbing', icon: <Zap size={16} />, shortcut: 'E' },
  ];

  const outdoorTools: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'site', label: 'Site Planning & Outdoor Living Studio', icon: <Trees size={16} />, shortcut: 'P' },
  ];

  const utilityTools: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'measure', label: 'Dimension / Measure', icon: <Ruler size={16} />, shortcut: 'M' },
  ];

  const renderToolButton = (t: { id: CADTool; label: string; icon: React.ReactNode; shortcut: string }) => {
    const isActive = activeTool === t.id;
    return (
      <button
        key={t.id}
        onClick={() => {
          onToolChange(t.id);
          if (t.id === 'furniture' && onOpenFurnitureCatalog) {
            onOpenFurnitureCatalog();
          }
          if (t.id === 'flooring' && onOpenFlooringStudio) {
            onOpenFlooringStudio();
          }
          if (t.id === 'site' && onOpenSiteModal) {
            onOpenSiteModal();
          }
        }}
        title={`${t.label} (Press ${t.shortcut})`}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isActive ? 'var(--accent-blue)' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-secondary)',
          boxShadow: isActive ? '0 2px 4px rgba(37, 99, 235, 0.3)' : 'none',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        {t.icon}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: 52,
        background: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        gap: 6,
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* Navigation Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navTools.map(renderToolButton)}
      </div>

      <div style={{ width: 26, height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

      {/* Architectural Structure Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {archTools.map(renderToolButton)}
      </div>

      <div style={{ width: 26, height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

      {/* Interior & Furniture */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {interiorTools.map(renderToolButton)}
      </div>

      <div style={{ width: 26, height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

      {/* Site Planning & Outdoor Living */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {outdoorTools.map(renderToolButton)}
      </div>

      <div style={{ width: 26, height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

      {/* Utilities: Measure & Reference Plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {utilityTools.map(renderToolButton)}

        {/* Import Plan Blueprint for Tracing */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onImportReferencePlan) {
              onImportReferencePlan(file);
            }
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Reference Plan Image for Tracing"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
            e.currentTarget.style.color = 'var(--accent-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <FileImage size={16} />
        </button>

        {/* Delete Selection Action Button */}
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          title="Delete Selected Item (Delete/Backspace)"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hasSelection ? '#fff1f2' : 'transparent',
            color: hasSelection ? 'var(--accent-rose)' : 'var(--text-muted)',
            opacity: hasSelection ? 1 : 0.35,
            cursor: hasSelection ? 'pointer' : 'default',
            border: hasSelection ? '1px solid #fecdd3' : '1px solid transparent',
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Spacer pushing footer down */}
      <div style={{ flex: 1 }} />

      {/* Wall Thickness Selector (Highlighted when Wall Tool is active) */}
      {activeTool === 'wall' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '6px 4px',
            background: 'var(--bg-panel-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>THICK</span>
          {[
            { label: '9"', val: 144 },
            { label: '6"', val: 96 },
            { label: '4½"', val: 72 },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => onThicknessChange(t.val)}
              style={{
                width: 32,
                height: 20,
                fontSize: 10,
                fontWeight: activeThickness === t.val ? 700 : 500,
                borderRadius: 4,
                background: activeThickness === t.val ? 'var(--accent-blue)' : 'transparent',
                color: activeThickness === t.val ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* MEP Fixture Selector (Highlighted when MEP Tool is active) */}
      {activeTool === 'mep' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '4px 2px',
            background: 'var(--bg-panel-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            marginBottom: 4,
            maxHeight: 160,
            overflowY: 'auto',
          }}
        >
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700 }}>MEP [1-9]</span>
          {MEP_CATALOG.map((cat) => {
            const isSel = (activeSymbolType || 'light_point') === cat.type;
            return (
              <button
                key={cat.type}
                onClick={() => onSymbolTypeChange && onSymbolTypeChange(cat.type)}
                title={`${cat.name} (Key ${cat.hotkey}) - ${cat.description}`}
                style={{
                  width: 34,
                  height: 20,
                  fontSize: 8.5,
                  fontWeight: isSel ? 700 : 500,
                  borderRadius: 4,
                  background: isSel ? 'var(--accent-blue)' : 'transparent',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {cat.symbolCode}
              </button>
            );
          })}
        </div>
      )}

      {/* Snapping & Ortho Controls at Bottom */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '6px 0',
          borderTop: '1px solid var(--border-subtle)',
          width: '100%',
        }}
      >
        <button
          onClick={onOrthogonalSnapToggle}
          title={`Ortho Angle Snap (90° / 45°): ${orthogonalSnap ? 'ON' : 'OFF'}`}
          style={{
            width: 34,
            height: 30,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: orthogonalSnap ? '#ecfdf5' : 'transparent',
            color: orthogonalSnap ? '#059669' : 'var(--text-muted)',
            border: orthogonalSnap ? '1px solid #a7f3d0' : '1px solid transparent',
          }}
        >
          <Grid size={15} />
        </button>

        {/* Snap Grid Toggle */}
        <button
          onClick={() => {
            const presets = [SNAP_PRESETS.ONE_INCH, SNAP_PRESETS.SIX_INCHES, SNAP_PRESETS.ONE_FOOT] as const;
            const curIdx = presets.indexOf(snapGrid as any);
            const nextIdx = curIdx >= 0 ? (curIdx + 1) % presets.length : 0;
            onSnapGridChange(presets[nextIdx]);
          }}
          title={`Grid Snap: ${snapGrid === SNAP_PRESETS.ONE_INCH ? '1"' : snapGrid === SNAP_PRESETS.SIX_INCHES ? '6"' : '1\''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 24,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            color: 'var(--text-secondary)',
            background: 'var(--bg-panel-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {snapGrid === SNAP_PRESETS.ONE_INCH ? '1"' : snapGrid === SNAP_PRESETS.SIX_INCHES ? '6"' : '1\''}
        </button>
      </div>
    </aside>
  );
};

