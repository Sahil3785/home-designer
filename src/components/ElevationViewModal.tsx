import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, Floor, Room, Wall, WallOpening } from '../core/model/types';
import { wallLength, wallAngle } from '../core/model/geometry';
import { formatFeetInches, SIXTEENTHS_PER_FOOT } from '../core/units';
import { X, Download, Printer, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ElevationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedRoomId?: string | null;
}

type ElevationDir = 'north' | 'south' | 'east' | 'west';

const DIR_CONFIG: Record<ElevationDir, { label: string; icon: React.ReactNode; angle: number }> = {
  north: { label: 'North', icon: <ArrowUp size={13} />, angle: Math.PI * 1.5 },
  south: { label: 'South', icon: <ArrowDown size={13} />, angle: Math.PI * 0.5 },
  east: { label: 'East', icon: <ArrowRight size={13} />, angle: 0 },
  west: { label: 'West', icon: <ArrowLeft size={13} />, angle: Math.PI },
};

export const ElevationViewModal: React.FC<ElevationViewModalProps> = ({
  isOpen, onClose, project, selectedRoomId,
}) => {
  const [direction, setDirection] = useState<ElevationDir>('north');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const selectedRoom = activeFloor.rooms.find((r) => r.id === selectedRoomId) || activeFloor.rooms[0];

  const drawElevation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRoom) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0c1b33';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(56,189,248,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Determine which wall to draw based on direction
    // Find the wall of the room polygon facing the specified direction
    const poly = selectedRoom.polygon;
    if (poly.length < 3) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No room polygon data available', W / 2, H / 2);
      return;
    }

    // Compute room bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of poly) {
      minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
    }

    const roomWidthSx = maxX - minX;
    const roomDepthSx = maxY - minY;
    const ceilHt = activeFloor.ceilingHeight;

    // For elevation: width = room dimension perpendicular to direction, height = ceiling height
    const isNS = direction === 'north' || direction === 'south';
    const elevWidthSx = isNS ? roomWidthSx : roomDepthSx;
    const elevHeightSx = ceilHt;

    // Margins
    const marginLeft = 80, marginRight = 40, marginTop = 60, marginBottom = 80;
    const drawW = W - marginLeft - marginRight;
    const drawH = H - marginTop - marginBottom;

    const scale = Math.min(drawW / (elevWidthSx / SIXTEENTHS_PER_FOOT), drawH / (ceilHt / SIXTEENTHS_PER_FOOT));
    const sceneW = (elevWidthSx / SIXTEENTHS_PER_FOOT) * scale;
    const sceneH = (ceilHt / SIXTEENTHS_PER_FOOT) * scale;
    const ox = marginLeft + (drawW - sceneW) / 2;
    const oy = marginTop + (drawH - sceneH) / 2;

    // Floor line hatch
    const floorY = oy + sceneH;
    ctx.fillStyle = '#1a3252';
    ctx.fillRect(ox, floorY, sceneW, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    for (let hx = ox; hx < ox + sceneW; hx += 12) {
      ctx.beginPath(); ctx.moveTo(hx, floorY); ctx.lineTo(hx + 6, floorY + 20); ctx.stroke();
    }

    // Wall face background
    ctx.fillStyle = '#081d35';
    ctx.fillRect(ox, oy, sceneW, sceneH);

    // Wall outline
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, sceneW, sceneH);

    // Find openings on the wall facing this direction
    const targetWalls: { wall: Wall; x0: number }[] = [];
    for (const wall of activeFloor.walls) {
      if (!selectedRoom.wallIds.includes(wall.id)) continue;
      const angle = wallAngle(wall);
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const dirAngle = DIR_CONFIG[direction].angle;
      const diff = Math.abs(normalizedAngle - dirAngle);
      if (diff < 0.4 || diff > Math.PI * 2 - 0.4) {
        // Wall faces this direction
        const wallStart = direction === 'north' || direction === 'south' ? wall.start.x : wall.start.y;
        const wallOff = isNS ? (wallStart - minX) / SIXTEENTHS_PER_FOOT : (wallStart - minY) / SIXTEENTHS_PER_FOOT;
        targetWalls.push({ wall, x0: wallOff * scale });
      }
    }

    // Draw openings
    const allOpenings: { op: WallOpening; wallX0: number }[] = [];
    for (const { wall, x0 } of targetWalls) {
      for (const op of wall.openings) {
        allOpenings.push({ op, wallX0: x0 });
      }
    }

    for (const { op, wallX0 } of allOpenings) {
      const opX = ox + wallX0 + (op.offsetAlongWall / SIXTEENTHS_PER_FOOT) * scale;
      const opW = (op.width / SIXTEENTHS_PER_FOOT) * scale;
      const opH = (op.height / SIXTEENTHS_PER_FOOT) * scale;
      const sillPx = (op.elevation / SIXTEENTHS_PER_FOOT) * scale;
      const opY = oy + sceneH - sillPx - opH;

      if (op.type === 'door') {
        // Door: filled rectangle with diagonal swing line
        ctx.fillStyle = '#0f2d4a';
        ctx.fillRect(opX, opY, opW, opH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(opX, opY, opW, opH);
        // Swing arc indicator
        ctx.beginPath();
        ctx.moveTo(opX, oy + sceneH);
        ctx.lineTo(opX + opW * 0.5, opY + opH * 0.2);
        ctx.strokeStyle = 'rgba(56,189,248,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${Math.max(8, scale * 0.08)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText('D', opX + opW / 2, oy + sceneH - 4);
      } else if (op.type === 'window' || op.type === 'ventilator') {
        // Window: glass pane with muntins
        ctx.fillStyle = 'rgba(56,189,248,0.12)';
        ctx.fillRect(opX, opY, opW, opH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(opX, opY, opW, opH);
        // Center muntin
        ctx.beginPath();
        ctx.moveTo(opX + opW / 2, opY);
        ctx.lineTo(opX + opW / 2, opY + opH);
        ctx.strokeStyle = 'rgba(56,189,248,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(opX, opY + opH / 2);
        ctx.lineTo(opX + opW, opY + opH / 2);
        ctx.stroke();
        // Sill line
        if (sillPx > 10) {
          ctx.beginPath();
          ctx.moveTo(opX - 8, oy + sceneH - sillPx);
          ctx.lineTo(opX + opW + 8, oy + sceneH - sillPx);
          ctx.strokeStyle = 'rgba(56,189,248,0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${Math.max(8, scale * 0.07)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(op.type === 'ventilator' ? 'V' : 'W', opX + opW / 2, opY - 4);
      }

      // Dimension annotation
      ctx.fillStyle = 'rgba(56,189,248,0.8)';
      ctx.font = `${Math.max(8, scale * 0.06)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(formatFeetInches(op.width), opX + opW / 2, opY + opH + 14);
    }

    // Ceiling dimension line
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(ox - 30, oy); ctx.lineTo(ox - 10, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox - 30, oy + sceneH); ctx.lineTo(ox - 10, oy + sceneH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox - 20, oy); ctx.lineTo(ox - 20, oy + sceneH); ctx.stroke();
    // Arrowheads
    ctx.fillStyle = 'rgba(56,189,248,0.6)';
    ctx.beginPath(); ctx.moveTo(ox - 20, oy); ctx.lineTo(ox - 24, oy + 8); ctx.lineTo(ox - 16, oy + 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox - 20, oy + sceneH); ctx.lineTo(ox - 24, oy + sceneH - 8); ctx.lineTo(ox - 16, oy + sceneH - 8); ctx.closePath(); ctx.fill();
    // Ceiling height label
    ctx.save();
    ctx.translate(ox - 42, oy + sceneH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(formatFeetInches(ceilHt), 0, 0);
    ctx.restore();

    // Width dimension at bottom
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(ox, oy + sceneH + 30); ctx.lineTo(ox, oy + sceneH + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + sceneW, oy + sceneH + 30); ctx.lineTo(ox + sceneW, oy + sceneH + 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox, oy + sceneH + 20); ctx.lineTo(ox + sceneW, oy + sceneH + 20); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(formatFeetInches(isNS ? roomWidthSx : roomDepthSx), ox + sceneW / 2, oy + sceneH + 38);

    // Title
    const dirLabel = `${selectedRoom.name.toUpperCase()} — ${direction.toUpperCase()} ELEVATION`;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(dirLabel, W / 2, 28);

    // Scale note
    ctx.fillStyle = 'rgba(56,189,248,0.5)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`SCALE: NTS  |  ${activeFloor.name}`, W - 16, H - 16);
  }, [selectedRoom, direction, activeFloor]);

  useEffect(() => {
    if (isOpen) drawElevation();
  }, [isOpen, drawElevation]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Draw at 2x for sharper export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width * 2;
    exportCanvas.height = canvas.height * 2;
    const ectx = exportCanvas.getContext('2d');
    if (!ectx) return;
    ectx.scale(2, 2);
    ectx.drawImage(canvas, 0, 0);
    const url = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRoom?.name || 'Room'}_${direction}_elevation.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 16,
        border: '1px solid var(--border-medium)',
        width: '92vw', maxWidth: 1100, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel-secondary)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Elevation View — {selectedRoom?.name || 'Select a Room'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Interior wall elevation drawings · {activeFloor.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Direction Tabs */}
            {(Object.keys(DIR_CONFIG) as ElevationDir[]).map((dir) => (
              <button key={dir} onClick={() => setDirection(dir)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: direction === dir ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'var(--bg-elevated)',
                color: direction === dir ? 'white' : 'var(--text-secondary)',
              }}>
                {DIR_CONFIG[dir].icon} {DIR_CONFIG[dir].label}
              </button>
            ))}
            <button onClick={handleDownload} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}><Download size={13} />PNG</button>
            <button onClick={() => window.print()} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}><Printer size={13} />PDF</button>
            <button onClick={onClose} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex',
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#060e1c', minHeight: 0 }}>
          {!selectedRoom ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
              <div>Select a room in the 2D plan to view its elevation</div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={920}
              height={480}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </div>

        {/* Footer Info */}
        {selectedRoom && (
          <div style={{
            padding: '10px 24px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
            background: 'var(--bg-panel-secondary)',
          }}>
            {[
              { label: 'Room', value: selectedRoom.name },
              { label: 'Ceiling Height', value: formatFeetInches(activeFloor.ceilingHeight) },
              { label: 'Openings on wall', value: `${activeFloor.walls.filter((w) => selectedRoom.wallIds.includes(w.id)).reduce((s, w) => s + w.openings.length, 0)} total` },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{s.label}: </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
