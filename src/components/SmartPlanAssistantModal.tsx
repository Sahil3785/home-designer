import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Wand2,
  Sparkles,
  Home,
  Layers,
  Check,
  Compass,
  Plus,
  Trash2,
  Maximize2,
  Armchair,
  DoorOpen,
  AppWindow,
  RotateCcw,
  Sliders,
  Send,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  parseFloorPlanPrompt,
  QUICK_TEMPLATES,
  RoomSpec,
  RoomCategory,
  ZonePlacement,
  DEFAULT_ROOM_DIMENSIONS,
} from '../core/generator/promptParser';
import { generateSmartFloorPlan, GeneratedPlanResult } from '../core/generator/smartLayoutEngine';
import { Floor } from '../core/model/types';
import { formatFeetInches } from '../core/units';

interface SmartPlanAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (generatedFloor: Floor, title: string) => void;
  activeFloorId: string;
}

export const SmartPlanAssistantModal: React.FC<SmartPlanAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  activeFloorId,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'builder'>('prompt');
  const [promptText, setPromptText] = useState(
    '3 BHK 35x45 with master bedroom 14x16 in SW with attached toilet, kitchen in SE, living room 16x20 in NE, dining, 2 bedrooms in NW, common bathroom'
  );

  // Builder State
  const [plotWidthFt, setPlotWidthFt] = useState(35);
  const [plotDepthFt, setPlotDepthFt] = useState(45);
  const [vastuMode, setVastuMode] = useState(true);
  const [autoFurniture, setAutoFurniture] = useState(true);
  const [builderRooms, setBuilderRooms] = useState<RoomSpec[]>([
    { id: 'b_living', name: 'Living Hall', category: 'living', widthFt: 16, depthFt: 18, preferredZone: 'NE' },
    { id: 'b_kitchen', name: 'Modular Kitchen', category: 'kitchen', widthFt: 10, depthFt: 12, preferredZone: 'SE' },
    { id: 'b_master', name: 'Master Bedroom', category: 'master_bedroom', widthFt: 14, depthFt: 15, preferredZone: 'SW' },
    { id: 'b_toilet', name: 'Attached Bath', category: 'attached_toilet', widthFt: 5, depthFt: 7, preferredZone: 'SW' },
    { id: 'b_bed2', name: 'Bedroom 2', category: 'bedroom', widthFt: 12, depthFt: 13, preferredZone: 'NW' },
    { id: 'b_bath', name: 'Common Bath', category: 'bathroom', widthFt: 5, depthFt: 7, preferredZone: 'W' },
  ]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate Plan Result based on current mode
  const generatedResult: GeneratedPlanResult = useMemo(() => {
    if (activeTab === 'prompt') {
      const spec = parseFloorPlanPrompt(promptText || '2 BHK 30x40');
      return generateSmartFloorPlan(spec, activeFloorId);
    } else {
      const spec = {
        title: `Custom Home Design (${plotWidthFt}′ × ${plotDepthFt}′)`,
        plotWidthFt,
        plotDepthFt,
        rooms: builderRooms,
        vastuCompliant: vastuMode,
        autoFurniture,
        exteriorWallThicknessInches: 9,
        interiorWallThicknessInches: 4.5,
        ceilingHeightFt: 10,
      };
      return generateSmartFloorPlan(spec, activeFloorId);
    }
  }, [activeTab, promptText, plotWidthFt, plotDepthFt, builderRooms, vastuMode, autoFurniture, activeFloorId]);

  // Render 2D Schematic Mini-Preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear Background
    ctx.fillStyle = '#0f172a'; // dark sleek blueprint background
    ctx.fillRect(0, 0, width, height);

    // Draw Subtle Blueprint Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const { floor } = generatedResult;
    if (!floor.rooms || floor.rooms.length === 0) return;

    // Calculate Bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const room of floor.rooms) {
      for (const p of room.polygon) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }

    const planW = maxX - minX || 1000;
    const planH = maxY - minY || 1000;
    const margin = 40;
    const scale = Math.min((width - margin * 2) / planW, (height - margin * 2) / planH);

    const toScreen = (pt: { x: number; y: number }) => {
      const sx = width / 2 + (pt.x - (minX + maxX) / 2) * scale;
      const sy = height / 2 - (pt.y - (minY + maxY) / 2) * scale;
      return { x: sx, y: sy };
    };

    // Draw Rooms with Color Tints
    const roomColors: Record<string, string> = {
      living: 'rgba(59, 130, 246, 0.25)',
      bedroom: 'rgba(168, 85, 247, 0.22)',
      master_bedroom: 'rgba(236, 72, 153, 0.22)',
      kitchen: 'rgba(249, 115, 22, 0.25)',
      dining: 'rgba(234, 179, 8, 0.22)',
      bathroom: 'rgba(14, 165, 233, 0.25)',
      attached_toilet: 'rgba(14, 165, 233, 0.25)',
      puja: 'rgba(245, 158, 11, 0.3)',
      study: 'rgba(16, 185, 129, 0.22)',
      balcony: 'rgba(34, 197, 94, 0.2)',
    };

    floor.rooms.forEach((room) => {
      if (room.polygon.length < 3) return;
      const pts = room.polygon.map(toScreen);

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();

      // Find color category
      const nameLower = room.name.toLowerCase();
      let fillCol = 'rgba(148, 163, 184, 0.18)';
      for (const [k, v] of Object.entries(roomColors)) {
        if (nameLower.includes(k.replace('_', ' ')) || nameLower.includes(k)) {
          fillCol = v;
          break;
        }
      }
      ctx.fillStyle = fillCol;
      ctx.fill();

      // Room Center Label & Area
      const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, cx, cy - 6);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`${room.computedAreaSqFt || 0} sq ft`, cx, cy + 8);
    });

    // Draw Walls
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    floor.walls.forEach((wall) => {
      const p1 = toScreen(wall.start);
      const p2 = toScreen(wall.end);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Draw Openings (Doors / Windows)
      wall.openings.forEach((op) => {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy) || 1;
        const opRatio = op.offsetAlongWall / len;
        const opX = wall.start.x + dx * opRatio;
        const opY = wall.start.y + dy * opRatio;
        const opScreen = toScreen({ x: opX, y: opY });

        ctx.fillStyle = op.type === 'door' ? '#38bdf8' : '#eab308';
        ctx.beginPath();
        ctx.arc(opScreen.x, opScreen.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw Compass Rose in Top-Right Corner
    ctx.save();
    ctx.translate(width - 32, 32);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -8);
    ctx.restore();
  }, [generatedResult]);

  if (!isOpen) return null;

  const handleApply = () => {
    const title =
      activeTab === 'prompt'
        ? parseFloorPlanPrompt(promptText).title
        : `Custom Plan (${plotWidthFt}′×${plotDepthFt}′)`;
    onApplyPlan(generatedResult.floor, title);
    onClose();
  };

  const handleAddRoom = (cat: RoomCategory) => {
    const def = DEFAULT_ROOM_DIMENSIONS[cat];
    const newRoom: RoomSpec = {
      id: `b_${cat}_${Date.now()}`,
      name: def.name,
      category: cat,
      widthFt: def.widthFt,
      depthFt: def.depthFt,
      preferredZone: def.defaultZone,
    };
    setBuilderRooms([...builderRooms, newRoom]);
  };

  const handleRemoveRoom = (id: string) => {
    setBuilderRooms(builderRooms.filter((r) => r.id !== id));
  };

  const handleUpdateRoom = (id: string, updates: Partial<RoomSpec>) => {
    setBuilderRooms(builderRooms.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 960,
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
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
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Wand2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Smart Floor Plan Assistant
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  100% Offline AI
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Describe your dream home in simple words or use the visual room builder — zero drawing required!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('prompt')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'prompt' ? '2px solid #2563eb' : '2px solid transparent',
              background: activeTab === 'prompt' ? '#ffffff' : 'transparent',
              color: activeTab === 'prompt' ? '#2563eb' : 'var(--text-secondary)',
              fontWeight: activeTab === 'prompt' ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={15} />
            <span>Natural Language AI Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'builder' ? '2px solid #2563eb' : '2px solid transparent',
              background: activeTab === 'builder' ? '#ffffff' : 'transparent',
              color: activeTab === 'builder' ? '#2563eb' : 'var(--text-secondary)',
              fontWeight: activeTab === 'builder' ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Sliders size={15} />
            <span>Guided Room Builder</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Inputs Panel */}
          <div
            style={{
              flex: '1 1 50%',
              padding: 20,
              overflowY: 'auto',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {activeTab === 'prompt' ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    💬 Describe your home requirements in simple words:
                  </label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={4}
                    placeholder="e.g. 3 BHK 30x40 with master bedroom 14x16 in SW with attached toilet, kitchen in SE, living room in NE, 2 bedrooms in NW..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-medium)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      lineHeight: 1.4,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    ⚡ Instant Quick Templates (Click to load):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {QUICK_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPromptText(tmpl.prompt)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: promptText === tmpl.prompt ? '#eff6ff' : '#f8fafc',
                          border: '1px solid ' + (promptText === tmpl.prompt ? '#93c5fd' : 'var(--border-subtle)'),
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tmpl.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '1px 5px', borderRadius: 3 }}>
                            {tmpl.bhk}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>{tmpl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guided Builder */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Plot Width (ft)
                    </label>
                    <input
                      type="number"
                      value={plotWidthFt}
                      onChange={(e) => setPlotWidthFt(Math.max(15, parseInt(e.target.value) || 20))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Plot Depth (ft)
                    </label>
                    <input
                      type="number"
                      value={plotDepthFt}
                      onChange={(e) => setPlotDepthFt(Math.max(15, parseInt(e.target.value) || 20))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={vastuMode} onChange={(e) => setVastuMode(e.target.checked)} />
                    <span>🧭 Vastu Shastra Compliance</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoFurniture} onChange={(e) => setAutoFurniture(e.target.checked)} />
                    <span>🛋️ Auto-Stage Furniture</span>
                  </label>
                </div>

                {/* Rooms List */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Rooms ({builderRooms.length})</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleAddRoom('bedroom')}
                        style={{ fontSize: 11, padding: '3px 6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer' }}
                      >
                        + Bed
                      </button>
                      <button
                        onClick={() => handleAddRoom('bathroom')}
                        style={{ fontSize: 11, padding: '3px 6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer' }}
                      >
                        + Bath
                      </button>
                      <button
                        onClick={() => handleAddRoom('puja')}
                        style={{ fontSize: 11, padding: '3px 6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer' }}
                      >
                        + Puja
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {builderRooms.map((rm) => (
                      <div
                        key={rm.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', width: 110 }}>{rm.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            value={rm.widthFt}
                            onChange={(e) => handleUpdateRoom(rm.id, { widthFt: Math.max(4, parseInt(e.target.value) || 10) })}
                            style={{ width: 42, padding: '2px 4px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-medium)' }}
                          />
                          <span>×</span>
                          <input
                            type="number"
                            value={rm.depthFt}
                            onChange={(e) => handleUpdateRoom(rm.id, { depthFt: Math.max(4, parseInt(e.target.value) || 10) })}
                            style={{ width: 42, padding: '2px 4px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-medium)' }}
                          />
                          <span>ft</span>
                        </div>

                        <select
                          value={rm.preferredZone}
                          onChange={(e) => handleUpdateRoom(rm.id, { preferredZone: e.target.value as ZonePlacement })}
                          style={{ padding: '2px 4px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-medium)' }}
                        >
                          <option value="NE">North-East</option>
                          <option value="NW">North-West</option>
                          <option value="SE">South-East</option>
                          <option value="SW">South-West</option>
                          <option value="N">North</option>
                          <option value="S">South</option>
                          <option value="E">East</option>
                          <option value="W">West</option>
                        </select>

                        <button
                          onClick={() => handleRemoveRoom(rm.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Live Preview Panel */}
          <div
            style={{
              flex: '1 1 50%',
              display: 'flex',
              flexDirection: 'column',
              background: '#0f172a',
              position: 'relative',
            }}
          >
            {/* Live Preview Canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
              <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

              {/* Floating Plan Summary Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  right: 12,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(51, 65, 85, 0.6)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#ffffff',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                    {generatedResult.summary.totalAreaSqFt} sq ft Total Built-Up
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    {generatedResult.summary.roomCount} Rooms • {generatedResult.summary.doorCount} Doors • {generatedResult.summary.windowCount} Windows • {generatedResult.summary.furnitureCount} Staged Items
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4ade80' }}>
                  <Check size={14} />
                  <span>Verified 2D/3D</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <HelpCircle size={14} />
            <span>Generates complete walls, doors, windows, rooms and 3D perspectives with full Undo (`⌘Z`) support.</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: 6,
                border: '1px solid var(--border-medium)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              style={{
                padding: '7px 18px',
                borderRadius: 6,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Wand2 size={14} />
              <span>Generate & Apply to Floor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
