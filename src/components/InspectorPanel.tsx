import React, { useState } from 'react';
import {
  Project,
  Wall,
  WallOpening,
  Staircase,
  Column,
  FurnitureInstance,
  ReferencePlan,
  Room,
  ArchitecturalSymbol,
} from '../core/model/types';
import { FeetInchesInput } from './FeetInchesInput';
import {
  Sixteenths,
  formatFeetInches,
  feetInchesToSixteenths,
  wallLength,
} from '../core';
import { calculateStairParameters } from '../core/model/staircase';
import { RotationControl } from './RotationControl';
import {
  wallAngle,
  rotateWallAroundMidpoint,
  reverseWallDirection,
  resizeWall,
  WallResizeAnchor,
} from '../core/model/geometry';
import { FURNITURE_CATALOG } from '../core/model/furniture';
import { DEFAULT_MATERIALS } from '../core/model/defaults';
import {
  Layers,
  Sliders,
  Maximize2,
  DoorOpen,
  AppWindow,
  Sparkles,
  Trash2,
  Home,
  Plus,
  RotateCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Target,
  Image as ImageIcon,
  Paintbrush,
  Palette,
  Check,
  Zap,
  Grid,
} from 'lucide-react';

interface InspectorPanelProps {
  project: Project;
  selectedWallId: string | null;
  selectedOpeningId?: string | null;
  selectedRoomId?: string | null;
  selectedStairId?: string | null;
  selectedColumnId?: string | null;
  selectedFurnitureId?: string | null;
  selectedSymbolId?: string | null;
  onSelectOpening?: (openingId: string | null, wallId: string | null) => void;
  onSelectRoom?: (roomId: string | null) => void;
  onUpdateWall: (updatedWall: Wall) => void;
  onUpdateRoom?: (room: Room) => void;
  onAddOpening: (wallId: string, opening: WallOpening) => void;
  onUpdateOpening?: (wallId: string, opening: WallOpening) => void;
  onDeleteOpening?: (wallId: string, openingId: string) => void;
  onUpdateStaircase?: (stair: Staircase) => void;
  onDeleteStaircase?: (stairId: string) => void;
  onUpdateColumn?: (column: Column) => void;
  onDeleteColumn?: (columnId: string) => void;
  onUpdateFurniture?: (furniture: FurnitureInstance) => void;
  onDeleteFurniture?: (furnitureId: string) => void;
  onUpdateSymbol?: (symbol: ArchitecturalSymbol) => void;
  onDeleteSymbol?: (symbolId: string) => void;
  onUpdateReferencePlan?: (updates: Partial<ReferencePlan>) => void;
  onStartCalibration?: () => void;
  onOpenMaterialLibrary?: (target: {
    type: 'room-floor' | 'wall-interior' | 'wall-exterior';
    id: string;
    currentMaterialId?: string;
    title?: string;
  }) => void;
  onOpenFlooringStudio?: (roomId?: string) => void;
  onUpdateFloor: (
    floorId: string,
    updates: { name?: string; ceilingHeight?: Sixteenths; slabThickness?: Sixteenths }
  ) => void;
  onOpenAddFloorModal?: () => void;
  onDeleteFloor?: (floorId: string) => void;
  onOpenRoofModal?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  selectedWallId,
  selectedOpeningId,
  selectedRoomId,
  selectedStairId,
  selectedColumnId,
  selectedFurnitureId,
  selectedSymbolId,
  onSelectOpening,
  onSelectRoom,
  onUpdateWall,
  onUpdateRoom,
  onAddOpening,
  onUpdateOpening,
  onDeleteOpening,
  onUpdateStaircase,
  onDeleteStaircase,
  onUpdateColumn,
  onDeleteColumn,
  onUpdateFurniture,
  onDeleteFurniture,
  onUpdateSymbol,
  onDeleteSymbol,
  onUpdateReferencePlan,
  onStartCalibration,
  onOpenMaterialLibrary,
  onOpenFlooringStudio,
  onUpdateFloor,
  onOpenAddFloorModal,
  onDeleteFloor,
  onOpenRoofModal,
}) => {
  const [wallResizeAnchor, setWallResizeAnchor] = useState<WallResizeAnchor>('start');

  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const selectedWall = activeFloor.walls.find((w) => w.id === selectedWallId) || null;
  const selectedRoom = activeFloor.rooms.find((r) => r.id === selectedRoomId) || null;
  const selectedOpening = selectedWall?.openings.find((o) => o.id === selectedOpeningId) || null;
  const selectedStair = (activeFloor.stairs || []).find((s) => s.id === selectedStairId) || null;
  const selectedColumn = (activeFloor.columns || []).find((c) => c.id === selectedColumnId) || null;
  const selectedFurniture = (activeFloor.furniture || []).find((f) => f.id === selectedFurnitureId) || null;
  const selectedSymbol = (activeFloor.symbols || []).find((s) => s.id === selectedSymbolId) || null;
  const selectedFurnitureCatalogItem = selectedFurniture
    ? FURNITURE_CATALOG.find((c) => c.id === selectedFurniture.catalogId)
    : null;
  const refPlan = activeFloor.referencePlan || null;


  // Add a quick door to selected wall
  const handleAddDoor = () => {
    if (!selectedWall) return;
    const len = wallLength(selectedWall);
    const doorWidth = feetInchesToSixteenths(3, 0); // 3' 0"
    const doorHeight = feetInchesToSixteenths(6, 8); // 6' 8"

    const newDoor: WallOpening = {
      id: `op_door_${Date.now()}`,
      wallId: selectedWall.id,
      name: 'Interior Door',
      type: 'door',
      offsetAlongWall: Math.round(len / 2),
      width: doorWidth,
      height: doorHeight,
      elevation: 0,
      flipInward: true,
      flipHand: true,
    };

    onAddOpening(selectedWall.id, newDoor);
    if (onSelectOpening) onSelectOpening(newDoor.id, selectedWall.id);
  };

  // Add a quick window to selected wall
  const handleAddWindow = () => {
    if (!selectedWall) return;
    const len = wallLength(selectedWall);
    const winWidth = feetInchesToSixteenths(4, 0); // 4' 0"
    const winHeight = feetInchesToSixteenths(4, 0); // 4' 0"
    const sillElev = feetInchesToSixteenths(3, 0); // 3' 0"

    const newWin: WallOpening = {
      id: `op_win_${Date.now()}`,
      wallId: selectedWall.id,
      name: 'Double-Hung Window',
      type: 'window',
      offsetAlongWall: Math.round(len / 2),
      width: winWidth,
      height: winHeight,
      elevation: sillElev,
      flipInward: false,
      flipHand: false,
    };

    onAddOpening(selectedWall.id, newWin);
    if (onSelectOpening) onSelectOpening(newWin.id, selectedWall.id);
  };

  return (
    <aside
      style={{
        width: 310,
        background: '#ffffff',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={15} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Properties
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 12,
            background: selectedWall
              ? 'var(--accent-blue-subtle)'
              : selectedRoom
              ? 'var(--accent-emerald-subtle)'
              : selectedFurniture
              ? 'var(--accent-indigo-subtle)'
              : 'var(--bg-panel-secondary)',
            color: selectedWall
              ? 'var(--accent-blue)'
              : selectedRoom
              ? 'var(--accent-emerald)'
              : selectedSymbol
              ? 'var(--accent-blue)'
              : selectedFurniture
              ? 'var(--accent-indigo)'
              : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {selectedSymbol
            ? selectedSymbol.name
            : selectedWall
            ? 'Wall Selected'
            : selectedRoom
            ? selectedRoom.name
            : selectedFurniture
            ? selectedFurniture.name
            : selectedStair
            ? 'Staircase'
            : selectedColumn
            ? 'Column'
            : 'Floor Plan'}
        </span>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Selected MEP Architectural Symbol Section */}
        {selectedSymbol && onUpdateSymbol && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--accent-blue)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="var(--accent-blue)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
                  {selectedSymbol.name}
                </span>
              </div>
              {onDeleteSymbol && (
                <button
                  onClick={() => onDeleteSymbol(selectedSymbol.id)}
                  title="Delete MEP Fixture"
                  style={{ color: 'var(--accent-rose)', padding: '2px 4px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Category badge */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  background:
                    selectedSymbol.category === 'electrical'
                      ? '#fef3c7'
                      : selectedSymbol.category === 'plumbing'
                      ? '#e0f2fe'
                      : '#f1f5f9',
                  color:
                    selectedSymbol.category === 'electrical'
                      ? '#b45309'
                      : selectedSymbol.category === 'plumbing'
                      ? '#0369a1'
                      : '#334155',
                }}
              >
                {selectedSymbol.category}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                CAD: {selectedSymbol.type}
              </span>
            </div>

            {/* Fixture Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fixture Description</span>
              <input
                type="text"
                value={selectedSymbol.name}
                onChange={(e) => onUpdateSymbol({ ...selectedSymbol, name: e.target.value })}
                style={{
                  fontSize: 12,
                  padding: '5px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Mounting Elevation & Wattage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label="Mounting Height"
                value={selectedSymbol.elevation}
                onChange={(el) => onUpdateSymbol({ ...selectedSymbol, elevation: el })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rating (Watts)</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={selectedSymbol.wattage ?? 0}
                  onChange={(e) => onUpdateSymbol({ ...selectedSymbol, wattage: parseInt(e.target.value) || 0 })}
                  style={{
                    fontSize: 12,
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    height: 28,
                  }}
                />
              </div>
            </div>

            {/* Circuit / DB Tag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Circuit / Panel Tag</span>
              <input
                type="text"
                placeholder="e.g. CKT-1, Phase R, or DB-Ground"
                value={selectedSymbol.circuit || ''}
                onChange={(e) => onUpdateSymbol({ ...selectedSymbol, circuit: e.target.value })}
                style={{
                  fontSize: 12,
                  padding: '5px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Rotation Control */}
            <RotationControl
              angleRad={selectedSymbol.rotation}
              onChange={(rot) => onUpdateSymbol({ ...selectedSymbol, rotation: rot })}
              onFlip180={() => onUpdateSymbol({ ...selectedSymbol, rotation: (selectedSymbol.rotation + Math.PI) % (2 * Math.PI) })}
              label="Fixture Orientation"
            />
          </div>
        )}

        {/* Selected Furniture / Fixture Section */}
        {selectedFurniture && onUpdateFurniture && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: '1px solid #4f46e5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5' }}>
                🛋️ {selectedFurniture.name}
              </span>
              {onDeleteFurniture && (
                <button
                  onClick={() => onDeleteFurniture(selectedFurniture.id)}
                  title="Delete Furniture"
                  style={{ color: 'var(--accent-rose)', padding: '2px 4px', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* High-Resolution Catalog Item Preview Image */}
            {selectedFurnitureCatalogItem?.imageUrl && (
              <div
                style={{
                  height: 120,
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src={selectedFurnitureCatalogItem.imageUrl}
                  alt={selectedFurniture.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: selectedFurnitureCatalogItem.imageUrl.endsWith('.svg') ? '8px' : '2px',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Item Name</span>
              <input
                type="text"
                value={selectedFurniture.name}
                onChange={(e) => onUpdateFurniture({ ...selectedFurniture, name: e.target.value })}
                style={{
                  fontSize: 12,
                  padding: '5px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label="Width"
                value={selectedFurniture.dimensions.width}
                onChange={(w) =>
                  onUpdateFurniture({
                    ...selectedFurniture,
                    dimensions: { ...selectedFurniture.dimensions, width: w },
                  })
                }
                min={16}
                max={960}
              />
              <FeetInchesInput
                label="Depth"
                value={selectedFurniture.dimensions.depth}
                onChange={(d) =>
                  onUpdateFurniture({
                    ...selectedFurniture,
                    dimensions: { ...selectedFurniture.dimensions, depth: d },
                  })
                }
                min={16}
                max={960}
              />
            </div>

            <FeetInchesInput
              label="Height"
              value={selectedFurniture.dimensions.height}
              onChange={(h) =>
                onUpdateFurniture({
                  ...selectedFurniture,
                  dimensions: { ...selectedFurniture.dimensions, height: h },
                })
              }
              min={16}
              max={1920}
            />

            {/* 360° Universal Rotation Controls */}
            <RotationControl
              label="Orientation"
              angleRad={selectedFurniture.rotation}
              onChange={(rot) => onUpdateFurniture({ ...selectedFurniture, rotation: rot })}
            />
          </div>
        )}

        {/* Selected Column Section */}
        {selectedColumn && onUpdateColumn && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--accent-blue)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
                🏛️ Structural Column
              </span>
              {onDeleteColumn && (
                <button
                  onClick={() => onDeleteColumn(selectedColumn.id)}
                  title="Delete Column"
                  style={{ color: 'var(--accent-rose)', padding: '2px 4px' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Shape</span>
              <select
                value={selectedColumn.shape}
                onChange={(e) => onUpdateColumn({ ...selectedColumn, shape: e.target.value as any })}
                style={{ fontSize: 12, padding: '5px 8px', borderRadius: 4 }}
              >
                <option value="rectangular">Rectangular / Square Pillar</option>
                <option value="round">Round / Cylindrical Column</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label={selectedColumn.shape === 'rectangular' ? 'Width' : 'Diameter'}
                value={selectedColumn.width}
                onChange={(w) =>
                  onUpdateColumn({
                    ...selectedColumn,
                    width: w,
                    depth: selectedColumn.shape === 'round' ? w : selectedColumn.depth,
                  })
                }
                min={64}
                max={960}
              />
              {selectedColumn.shape === 'rectangular' && (
                <FeetInchesInput
                  label="Depth"
                  value={selectedColumn.depth}
                  onChange={(d) => onUpdateColumn({ ...selectedColumn, depth: d })}
                  min={64}
                  max={960}
                />
              )}
            </div>

            <FeetInchesInput
              label="Height"
              value={selectedColumn.height}
              onChange={(h) => onUpdateColumn({ ...selectedColumn, height: h })}
              min={192}
              max={3840}
            />

            {/* 360° Column Rotation Control */}
            <RotationControl
              label="Column Rotation"
              angleRad={selectedColumn.rotation || 0}
              onChange={(rot) => onUpdateColumn({ ...selectedColumn, rotation: rot })}
            />
          </div>
        )}

        {/* Selected Staircase Section */}
        {selectedStair && onUpdateStaircase && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: '1px solid #0284c7',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0284c7' }}>
                🪜 Staircase
              </span>
              {onDeleteStaircase && (
                <button
                  onClick={() => onDeleteStaircase(selectedStair.id)}
                  title="Delete Staircase"
                  style={{ color: 'var(--accent-rose)', padding: '2px 4px' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Flight Type</span>
              <select
                value={selectedStair.type}
                onChange={(e) => onUpdateStaircase({ ...selectedStair, type: e.target.value as any })}
                style={{ fontSize: 12, padding: '5px 8px', borderRadius: 4 }}
              >
                <option value="straight">Straight Run</option>
                <option value="l-shaped">L-Shaped (with 90° Landing)</option>
                <option value="u-shaped">U-Shaped (with 180° Landing)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label="Stair Width"
                value={selectedStair.width}
                onChange={(w) => onUpdateStaircase({ ...selectedStair, width: w })}
                min={384}
                max={1536}
              />
              <FeetInchesInput
                label="Tread Depth"
                value={selectedStair.treadDepth}
                onChange={(t) => onUpdateStaircase({ ...selectedStair, treadDepth: t })}
                min={160}
                max={384}
              />
            </div>

            {/* Handrail Toggle & Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedStair.hasHandrail}
                  onChange={(e) => onUpdateStaircase({ ...selectedStair, hasHandrail: e.target.checked })}
                />
                <span>Safety Handrail (36" height)</span>
              </label>

              {selectedStair.hasHandrail && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['both', 'left', 'right'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => onUpdateStaircase({ ...selectedStair, handrailSide: side })}
                      style={{
                        flex: 1,
                        fontSize: 10,
                        padding: '4px',
                        textTransform: 'capitalize',
                        background: selectedStair.handrailSide === side ? 'var(--accent-blue)' : 'var(--bg-surface)',
                        color: selectedStair.handrailSide === side ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 4,
                      }}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 360° Staircase Flight Direction Rotation */}
            <RotationControl
              label="Flight Direction"
              angleRad={selectedStair.angle}
              onChange={(angle) => onUpdateStaircase({ ...selectedStair, angle })}
            />

            {/* Code Calculation Badge */}
            {(() => {
              const calc = calculateStairParameters(selectedStair.totalRise, selectedStair.treadDepth);
              return (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#15803d' }}>
                    {calc.isCodeCompliant ? '✓ Architectural Code Compliant' : '⚠️ Code Warning'}
                  </div>
                  <div style={{ color: '#166534' }}>
                    Rise: {formatFeetInches(selectedStair.totalRise)} • {calc.riserCount} Risers @ {formatFeetInches(calc.riserHeight)}
                  </div>
                  <div style={{ color: '#166534' }}>
                    Formula: 2R + T = {calc.codeFormulaVal.toFixed(1)}" (Target: 24"–25.5")
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Selected Opening (Door/Window) Section */}
        {selectedOpening && selectedWall && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--border-highlight)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-amber)' }}>
                {selectedOpening.type === 'door' ? '🚪 Door Properties' : '🪟 Window Properties'}
              </span>
              {onDeleteOpening && (
                <button
                  onClick={() => onDeleteOpening(selectedWall.id, selectedOpening.id)}
                  title="Delete Opening"
                  style={{ color: 'var(--accent-rose)', padding: '2px 4px' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label="Width"
                value={selectedOpening.width}
                onChange={(w) =>
                  onUpdateOpening && onUpdateOpening(selectedWall.id, { ...selectedOpening, width: w })
                }
              />
              <FeetInchesInput
                label="Height"
                value={selectedOpening.height}
                onChange={(h) =>
                  onUpdateOpening && onUpdateOpening(selectedWall.id, { ...selectedOpening, height: h })
                }
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FeetInchesInput
                label="Offset Along Wall"
                value={selectedOpening.offsetAlongWall}
                onChange={(off) =>
                  onUpdateOpening && onUpdateOpening(selectedWall.id, { ...selectedOpening, offsetAlongWall: off })
                }
              />
              <FeetInchesInput
                label="Sill Elevation"
                value={selectedOpening.elevation}
                onChange={(el) =>
                  onUpdateOpening && onUpdateOpening(selectedWall.id, { ...selectedOpening, elevation: el })
                }
              />
            </div>

            {selectedOpening.type === 'door' && onUpdateOpening && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() =>
                      onUpdateOpening(selectedWall.id, {
                        ...selectedOpening,
                        flipInward: !selectedOpening.flipInward,
                      })
                    }
                    style={{
                      flex: 1,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Swing: {selectedOpening.flipInward ? 'Inside' : 'Outside'}
                  </button>

                  <button
                    onClick={() =>
                      onUpdateOpening(selectedWall.id, {
                        ...selectedOpening,
                        flipHand: !selectedOpening.flipHand,
                      })
                    }
                    style={{
                      flex: 1,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Hinge: {selectedOpening.flipHand ? 'Right' : 'Left'}
                  </button>
                </div>

                <button
                  onClick={() =>
                    onUpdateOpening(selectedWall.id, {
                      ...selectedOpening,
                      isOpen: !selectedOpening.isOpen,
                    })
                  }
                  style={{
                    width: '100%',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedOpening.isOpen ? '#ecfdf5' : 'var(--bg-surface)',
                    border: selectedOpening.isOpen ? '1px solid #a7f3d0' : '1px solid var(--border-medium)',
                    color: selectedOpening.isOpen ? '#059669' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  title="Toggle 3D Door Leaf Swung Open (90°) / Closed"
                >
                  <DoorOpen size={13} />
                  3D Door Leaf: {selectedOpening.isOpen ? 'Open (90°)' : 'Closed'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Room Section */}
        {selectedRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={15} color="var(--accent-emerald)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                  Selected Room
                </span>
              </div>
              <button
                onClick={() => onSelectRoom && onSelectRoom(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Deselect
              </button>
            </div>

            {/* Room Name Presets & Custom Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Room Name
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={selectedRoom.name}
                  onChange={(e) => onUpdateRoom && onUpdateRoom({ ...selectedRoom, name: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                  }}
                >
                  {[
                    'Living Room',
                    'Drawing Room',
                    'Master Bedroom',
                    'Bedroom 2',
                    'Bedroom 3',
                    'Guest Room',
                    'Kitchen',
                    'Dining Area',
                    'Pooja / Prayer Room',
                    'Bathroom',
                    'Master Bath',
                    'Powder Room',
                    'Balcony',
                    'Terrace',
                    'Foyer / Entrance',
                    'Lobby',
                    'Car Porch / Garage',
                    'Study / Home Office',
                    'Store Room',
                    'Utility / Laundry',
                  ].map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                  {/* Keep current name if custom */}
                  {![
                    'Living Room',
                    'Drawing Room',
                    'Master Bedroom',
                    'Bedroom 2',
                    'Bedroom 3',
                    'Guest Room',
                    'Kitchen',
                    'Dining Area',
                    'Pooja / Prayer Room',
                    'Bathroom',
                    'Master Bath',
                    'Powder Room',
                    'Balcony',
                    'Terrace',
                    'Foyer / Entrance',
                    'Lobby',
                    'Car Porch / Garage',
                    'Study / Home Office',
                    'Store Room',
                    'Utility / Laundry',
                  ].includes(selectedRoom.name) && (
                    <option value={selectedRoom.name}>{selectedRoom.name}</option>
                  )}
                </select>

                <input
                  type="text"
                  placeholder="Custom name..."
                  value={selectedRoom.name}
                  onChange={(e) => onUpdateRoom && onUpdateRoom({ ...selectedRoom, name: e.target.value })}
                  style={{
                    width: 110,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            {/* Room Dimensions & Area Summary */}
            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                border: '1px solid var(--border-medium)',
              }}
            >
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Floor Area
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {selectedRoom.computedAreaSqFt || 0} sq ft
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Room Dimensions
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {(() => {
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    for (const p of selectedRoom.polygon) {
                      minX = Math.min(minX, p.x);
                      maxX = Math.max(maxX, p.x);
                      minY = Math.min(minY, p.y);
                      maxY = Math.max(maxY, p.y);
                    }
                    const w = Math.round(maxX - minX);
                    const d = Math.round(maxY - minY);
                    return `${formatFeetInches(w)} × ${formatFeetInches(d)}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Room Flooring Finish */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Flooring Finish
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenMaterialLibrary &&
                    onOpenMaterialLibrary({
                      type: 'room-floor',
                      id: selectedRoom.id,
                      currentMaterialId: selectedRoom.floorMaterialId,
                      title: `${selectedRoom.name} Flooring`,
                    })
                  }
                  style={{
                    fontSize: 11,
                    color: 'var(--accent-blue)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Palette size={12} />
                  <span>Catalog</span>
                </button>
              </div>

              {/* Architectural Flooring Studio Action Button */}
              {onOpenFlooringStudio && (
                <button
                  type="button"
                  onClick={() => onOpenFlooringStudio(selectedRoom.id)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: 10,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <Grid size={15} />
                  <span>Open Flooring Studio (Tiles/Marble/PVC/Matte)</span>
                </button>
              )}

              {/* Quick Flooring Material Swatches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { id: 'mat_tile_vitrified_large', label: 'Tiles (Vitrified 24x48)', color: '#F4F4F4' },
                  { id: 'mat_marble_carrara', label: 'Carrara Marble', color: '#E8E7E3' },
                  { id: 'mat_marble_marquina', label: 'Nero Black Marble', color: '#1B1E22' },
                  { id: 'mat_pvc_lvt_plank', label: 'PVC/Vinyl Plank', color: '#8A7B6E' },
                  { id: 'mat_concrete_microcement', label: 'Matte Microcement', color: '#C2BDB5' },
                  { id: 'mat_tile_moroccan_encaustic', label: 'Moroccan Tiles', color: '#254A82' },
                  { id: 'mat_pvc_spc_honey', label: 'Rigid Core SPC Vinyl', color: '#C4A482' },
                  { id: 'mat_oak_hardwood', label: 'Natural White Oak', color: '#B58852' },
                ].map((matPreset) => {
                  const isSelected = selectedRoom.floorMaterialId === matPreset.id;
                  return (
                    <button
                      key={matPreset.id}
                      type="button"
                      title={matPreset.label}
                      onClick={() =>
                        onUpdateRoom && onUpdateRoom({ ...selectedRoom, floorMaterialId: matPreset.id })
                      }
                      style={{
                        height: 34,
                        borderRadius: 6,
                        backgroundColor: matPreset.color,
                        border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-medium)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.4)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={14} color={['#F4F4F4', '#E8E7E3', '#C2BDB5', '#A2A49F'].includes(matPreset.color) ? '#000' : '#fff'} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {/* Current Material Details */}
              {(() => {
                const currentMat = (project.materials || DEFAULT_MATERIALS).find(
                  (m) => m.id === selectedRoom.floorMaterialId
                ) || DEFAULT_MATERIALS[2];
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: currentMat.color,
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{currentMat.name}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Selected Wall Section */}
        {selectedWall ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                Selected Wall
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{selectedWall.id}</span>
            </div>

            {/* Interactive Wall Length with Anchor Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Maximize2 size={14} color="var(--accent-blue)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Wall Length</span>
                </div>
                {/* Resize Anchor Selector */}
                <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface)', padding: 2, borderRadius: 6, border: '1px solid var(--border-medium)' }}>
                  <button
                    type="button"
                    title="Anchor Start Point (End moves)"
                    onClick={() => setWallResizeAnchor('start')}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: wallResizeAnchor === 'start' ? 'var(--accent-blue)' : 'transparent',
                      color: wallResizeAnchor === 'start' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    Start →
                  </button>
                  <button
                    type="button"
                    title="Anchor Center (Expands symmetrically)"
                    onClick={() => setWallResizeAnchor('midpoint')}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: wallResizeAnchor === 'midpoint' ? 'var(--accent-blue)' : 'transparent',
                      color: wallResizeAnchor === 'midpoint' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    ↔ Center
                  </button>
                  <button
                    type="button"
                    title="Anchor End Point (Start moves)"
                    onClick={() => setWallResizeAnchor('end')}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: wallResizeAnchor === 'end' ? 'var(--accent-blue)' : 'transparent',
                      color: wallResizeAnchor === 'end' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    ← End
                  </button>
                </div>
              </div>

              <FeetInchesInput
                value={wallLength(selectedWall)}
                onChange={(newLen) => {
                  if (newLen >= 16) {
                    onUpdateWall(resizeWall(selectedWall, newLen, wallResizeAnchor));
                  }
                }}
                min={16}
                max={19200}
              />
            </div>

            {/* Wall Width / Thickness */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Wall Width / Thickness
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {formatFeetInches(selectedWall.thickness)}
                </span>
              </div>
              <FeetInchesInput
                value={selectedWall.thickness}
                onChange={(th) => onUpdateWall({ ...selectedWall, thickness: th })}
                min={16}
                max={384}
              />
              {/* Quick Architectural Wall Thickness Presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {[
                  { label: '4.5"', val: 72, name: 'Partition' },
                  { label: '6"', val: 96, name: 'Standard' },
                  { label: '9"', val: 144, name: 'Exterior' },
                  { label: '12"', val: 192, name: 'Masonry' },
                ].map((preset) => {
                  const isActive = Math.abs(selectedWall.thickness - preset.val) <= 1;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onUpdateWall({ ...selectedWall, thickness: preset.val })}
                      title={`${preset.name} (${preset.label})`}
                      style={{
                        padding: '4px 2px',
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wall Height */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Wall Height
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {formatFeetInches(selectedWall.height)}
                </span>
              </div>
              <FeetInchesInput
                value={selectedWall.height}
                onChange={(h) => onUpdateWall({ ...selectedWall, height: h })}
                min={192}
                max={3840}
              />
              {/* Quick Wall Height Presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {[
                  { label: "8' 0\"", val: 1536 },
                  { label: "9' 0\"", val: 1728 },
                  { label: "10' 0\"", val: 1920 },
                  { label: "12' 0\"", val: 2304 },
                ].map((preset) => {
                  const isActive = Math.abs(selectedWall.height - preset.val) <= 1;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onUpdateWall({ ...selectedWall, height: preset.val })}
                      style={{
                        padding: '4px 2px',
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 360° Wall Midpoint Rotation & Flip */}
            <RotationControl
              label="Wall Angle (Midpoint)"
              angleRad={wallAngle(selectedWall)}
              onChange={(ang) => onUpdateWall(rotateWallAroundMidpoint(selectedWall, ang))}
              onFlip180={() => onUpdateWall(reverseWallDirection(selectedWall))}
            />

            {/* Architectural Wall Finishes (Interior & Exterior) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Surface Finishes
                </span>
                <Paintbrush size={13} color="var(--accent-blue)" />
              </div>

              {/* Interior Finish */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Interior Side:</span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenMaterialLibrary &&
                    onOpenMaterialLibrary({
                      type: 'wall-interior',
                      id: selectedWall.id,
                      currentMaterialId: selectedWall.materialInteriorId,
                      title: 'Wall Interior Finish',
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor:
                        (project.materials || DEFAULT_MATERIALS).find(
                          (m) => m.id === selectedWall.materialInteriorId
                        )?.color || '#F4F4F2',
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                  />
                  <span>
                    {(project.materials || DEFAULT_MATERIALS).find(
                      (m) => m.id === selectedWall.materialInteriorId
                    )?.name.split('—')[1] || 'Warm White'}
                  </span>
                </button>
              </div>

              {/* Exterior Finish */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Exterior Side:</span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenMaterialLibrary &&
                    onOpenMaterialLibrary({
                      type: 'wall-exterior',
                      id: selectedWall.id,
                      currentMaterialId: selectedWall.materialExteriorId,
                      title: 'Wall Exterior Finish',
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor:
                        (project.materials || DEFAULT_MATERIALS).find(
                          (m) => m.id === selectedWall.materialExteriorId
                        )?.color || '#D8D8D6',
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                  />
                  <span>
                    {(project.materials || DEFAULT_MATERIALS).find(
                      (m) => m.id === selectedWall.materialExteriorId
                    )?.name.split('—')[1] || 'Modern Grey'}
                  </span>
                </button>
              </div>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Openings ({selectedWall.openings.length})
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={handleAddDoor}
                    title="Insert Door into Wall"
                    style={{
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 7px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-amber)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    <DoorOpen size={12} />
                    <span>+ Door</span>
                  </button>
                  <button
                    onClick={handleAddWindow}
                    title="Insert Window into Wall"
                    style={{
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 7px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-blue)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    <AppWindow size={12} />
                    <span>+ Window</span>
                  </button>
                </div>
              </div>

              {selectedWall.openings.map((op) => {
                const isSelected = op.id === selectedOpeningId;
                return (
                  <div
                    key={op.id}
                    onClick={() => onSelectOpening && onSelectOpening(op.id, selectedWall.id)}
                    style={{
                      background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500 }}>
                      <span style={{ color: op.type === 'door' ? 'var(--accent-amber)' : 'var(--accent-blue)' }}>
                        {op.type === 'door' ? '🚪 Door' : '🪟 Window'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {formatFeetInches(op.width)} × {formatFeetInches(op.height)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Reference Plan Inspector Section (if present on active floor) */}
        {refPlan && onUpdateReferencePlan && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-panel-secondary)',
              border: refPlan.isCalibrated ? '1px solid #2563eb' : '1px solid #eab308',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={14} color={refPlan.isCalibrated ? '#2563eb' : '#eab308'} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Reference Plan
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: refPlan.isCalibrated ? 'rgba(37, 99, 235, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  color: refPlan.isCalibrated ? '#2563eb' : '#b45309',
                }}
              >
                {refPlan.isCalibrated ? '✓ Calibrated' : '⚠ Uncalibrated'}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📄 {refPlan.fileName}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Dimensions:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {formatFeetInches(refPlan.width)} × {formatFeetInches(refPlan.height)}
              </span>
            </div>

            {/* Opacity Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Opacity:</span>
                <span style={{ fontWeight: 600 }}>{Math.round((refPlan.opacity ?? 0.6) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={refPlan.opacity ?? 0.6}
                onChange={(e) => onUpdateReferencePlan({ opacity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#2563eb' }}
              />
            </div>

            {/* Lock and Visibility Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                onClick={() => onUpdateReferencePlan({ isLocked: !refPlan.isLocked })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: refPlan.isLocked ? '#eff6ff' : 'var(--bg-surface)',
                  border: refPlan.isLocked ? '1px solid #93c5fd' : '1px solid var(--border-medium)',
                  color: refPlan.isLocked ? '#2563eb' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {refPlan.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span>{refPlan.isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>

              <button
                onClick={() => onUpdateReferencePlan({ isVisible: refPlan.isVisible === false ? true : false })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {refPlan.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{refPlan.isVisible !== false ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>

            {/* Recalibrate Button */}
            {onStartCalibration && (
              <button
                onClick={onStartCalibration}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <Target size={13} />
                <span>Calibrate Scale (2 Points)</span>
              </button>
            )}
          </div>
        )}

        {!selectedWall && !selectedRoom && !selectedStair && !selectedColumn && !selectedFurniture ? (
          <div
            style={{
              padding: 14,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-medium)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            Click on any wall, room, furniture, door, stair, or column in the 2D plan to inspect and edit dimensions.
          </div>
        ) : null}

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)' }} />

        {/* Floor Level Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} color="var(--accent-emerald)" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Floor Level ({activeFloor.levelIndex + 1} of {project.floors.length})
              </span>
            </div>
            {onOpenRoofModal && (
              <button
                onClick={onOpenRoofModal}
                title="Configure Roof"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  background: activeFloor.roof ? '#eff6ff' : 'var(--bg-surface)',
                  border: '1px solid ' + (activeFloor.roof ? '#bfdbfe' : 'var(--border-medium)'),
                  color: activeFloor.roof ? '#1d4ed8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Home size={12} />
                <span>Roof</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Floor Name</span>
            <input
              type="text"
              value={activeFloor.name}
              onChange={(e) => onUpdateFloor(activeFloor.id, { name: e.target.value })}
              style={{ padding: '6px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-medium)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FeetInchesInput
              label="Ceiling Height"
              value={activeFloor.ceilingHeight}
              onChange={(ch) => onUpdateFloor(activeFloor.id, { ceilingHeight: ch })}
              min={192}
              max={3840}
            />
            <FeetInchesInput
              label="Slab Thickness"
              value={activeFloor.slabThickness ?? feetInchesToSixteenths(1, 0)}
              onChange={(st) => onUpdateFloor(activeFloor.id, { slabThickness: st })}
              min={64}
              max={768}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>Floor Elevation:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {formatFeetInches(activeFloor.elevation)}
            </span>
          </div>

          {/* Add / Delete Floor Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {onOpenAddFloorModal && (
              <button
                onClick={onOpenAddFloorModal}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '5px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} />
                <span>Add Floor</span>
              </button>
            )}

            {onDeleteFloor && project.floors.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete floor "${activeFloor.name}" and all its walls?`)) {
                    onDeleteFloor(activeFloor.id);
                  }
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  background: 'var(--bg-surface)',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  cursor: 'pointer',
                }}
              >
                Delete Floor
              </button>
            )}
          </div>
        </div>

        {/* Materials Palette Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--accent-amber)" />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Project Materials ({project.materials.length})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {project.materials.map((m) => (
              <div
                key={m.id}
                title={`${m.name} (${m.category})`}
                style={{
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: m.color,
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
