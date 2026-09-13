import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, SectionCut } from '../core/model/types';
import { formatFeetInches } from '../core/units';
import {
  analyzeSectionCut,
  SectionAnalysis,
  createDefaultSectionCut,
} from '../core/model/sections';
import {
  X,
  Download,
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Compass,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';

interface SectionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  sectionCut?: SectionCut;
  selectedSectionId?: string | null;
  onUpdateSectionCut?: (cut: SectionCut) => void;
}

export const SectionViewModal: React.FC<SectionViewModalProps> = ({
  isOpen,
  onClose,
  project,
  sectionCut,
  selectedSectionId,
  onUpdateSectionCut,
}) => {
  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const allSections = activeFloor.sections && activeFloor.sections.length > 0
    ? activeFloor.sections
    : [createDefaultSectionCut()];

  const [selectedCutId, setSelectedCutId] = useState<string>(sectionCut?.id || selectedSectionId || allSections[0].id);
  const [theme, setTheme] = useState<'blueprint' | 'monochrome' | 'presentation'>('blueprint');
  const [zoom, setZoom] = useState<number>(1.0);

  useEffect(() => {
    if (sectionCut?.id) setSelectedCutId(sectionCut.id);
  }, [sectionCut?.id]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentCut = allSections.find((s) => s.id === selectedCutId) || allSections[0];

  const analysis: SectionAnalysis = React.useMemo(() => {
    return analyzeSectionCut(currentCut, project);
  }, [currentCut, project]);

  const drawSection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Themes
    const isBp = theme === 'blueprint';
    const isMono = theme === 'monochrome';

    const bg = isBp ? '#0c1b33' : isMono ? '#ffffff' : '#f8fafc';
    const gridLine = isBp ? 'rgba(56, 189, 248, 0.07)' : 'rgba(0,0,0,0.04)';
    const cutLine = isBp ? '#38bdf8' : isMono ? '#000000' : '#0f172a';
    const wallHatch = isBp ? 'rgba(56, 189, 248, 0.25)' : isMono ? '#333333' : '#64748b';
    const slabColor = isBp ? 'rgba(56, 189, 248, 0.35)' : isMono ? '#222222' : '#475569';
    const textColor = isBp ? '#f0f9ff' : '#0f172a';
    const dimColor = isBp ? '#93c5fd' : '#475569';
    const datumColor = isBp ? '#38bdf8' : '#2563eb';

    // Clear
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Architectural Grid Pattern
    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 1;
    const gs = 35;
    ctx.beginPath();
    for (let x = 0; x < W; x += gs) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += gs) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, H / 2 + 60);
    ctx.scale(zoom, zoom);

    // Scale conversion: map building dimensions to screen pixels
    const totalCutWidth = Math.max(analysis.totalLength, 3000);
    const availableWidth = W * 0.72;
    const scaleFactor = availableWidth / totalCutWidth;

    const toScreenX = (distFromP1: number) => {
      return (distFromP1 - analysis.totalLength / 2) * scaleFactor;
    };

    const toScreenY = (elevationSixteenths: number) => {
      // Invert Y: higher elevation = smaller Y on screen
      return -elevationSixteenths * scaleFactor;
    };

    // 1. Ground / Foundation Line & Earth Hatch
    const groundY = toScreenY(0);
    const fdnY = toScreenY(-384); // -2' 0"
    const leftBound = toScreenX(-400);
    const rightBound = toScreenX(analysis.totalLength + 400);

    ctx.fillStyle = isBp ? 'rgba(30, 58, 138, 0.4)' : 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(leftBound, groundY, rightBound - leftBound, 180);

    // Draw Earth hatched lines below ground
    ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = leftBound; x < rightBound; x += 25) {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 25, groundY + 25);
      ctx.moveTo(x + 10, groundY + 25);
      ctx.lineTo(x - 10, groundY + 45);
    }
    ctx.stroke();

    // Solid ground line
    ctx.strokeStyle = cutLine;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftBound - 60, groundY);
    ctx.lineTo(rightBound + 60, groundY);
    ctx.stroke();

    // 2. Multi-Story Slabs & Floor Cuts
    project.floors.forEach((floor, fIdx) => {
      const flElev = floor.elevation || 0;
      const slabThick = floor.slabThickness || 192; // 1' 0"
      const ySlabTop = toScreenY(flElev);
      const ySlabBot = toScreenY(flElev - slabThick);

      ctx.fillStyle = slabColor;
      ctx.fillRect(leftBound + 50, ySlabBot, rightBound - leftBound - 100, ySlabTop - ySlabBot);

      ctx.strokeStyle = cutLine;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(leftBound + 50, ySlabBot, rightBound - leftBound - 100, ySlabTop - ySlabBot);
    });

    // 3. Cut Walls with Architectural Diagonal Hatching
    analysis.cutWalls.forEach((cutWall) => {
      const xMid = toScreenX(cutWall.distanceAlongCut);
      const halfThick = (cutWall.wallThickness * scaleFactor) / 2;
      const xLeft = xMid - Math.max(halfThick, 6);
      const xRight = xMid + Math.max(halfThick, 6);
      const wallW = xRight - xLeft;

      const yBot = toScreenY(cutWall.floorElevation);
      const yTop = toScreenY(cutWall.floorElevation + cutWall.wallHeight);
      const wallH = yBot - yTop;

      if (cutWall.hitType === 'solid_wall') {
        // Draw solid wall rect
        ctx.fillStyle = isBp ? '#081426' : isMono ? '#ffffff' : '#f1f5f9';
        ctx.fillRect(xLeft, yTop, wallW, wallH);

        // Architectural 45° diagonal masonry hatch
        ctx.save();
        ctx.beginPath();
        ctx.rect(xLeft, yTop, wallW, wallH);
        ctx.clip();

        ctx.strokeStyle = wallHatch;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const hatchSpacing = 10;
        for (let offset = -wallH; offset < wallW + wallH; offset += hatchSpacing) {
          ctx.moveTo(xLeft + offset, yBot);
          ctx.lineTo(xLeft + offset + wallH, yTop);
        }
        ctx.stroke();
        ctx.restore();

        // Thick outline
        ctx.strokeStyle = cutLine;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(xLeft, yTop, wallW, wallH);
      } else if (cutWall.hitType === 'opening' && cutWall.opening) {
        const op = cutWall.opening;
        const sillElev = cutWall.floorElevation + op.elevation;
        const headElev = sillElev + op.height;

        const ySill = toScreenY(sillElev);
        const yHead = toScreenY(headElev);

        // Wall below sill
        if (op.elevation > 0) {
          ctx.fillStyle = isBp ? '#081426' : '#ffffff';
          ctx.fillRect(xLeft, ySill, wallW, yBot - ySill);
          ctx.strokeStyle = cutLine;
          ctx.lineWidth = 2;
          ctx.strokeRect(xLeft, ySill, wallW, yBot - ySill);
        }

        // Cut Opening Space
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0,0,0,0.03)';
        ctx.fillRect(xLeft, yHead, wallW, ySill - yHead);

        // Lintel / Header above opening
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(xLeft, yTop, wallW, yHead - yTop);
        ctx.strokeStyle = cutLine;
        ctx.lineWidth = 2;
        ctx.strokeRect(xLeft, yTop, wallW, yHead - yTop);

        // Glass or Door symbol inside opening
        if (op.type === 'window' || op.type === 'ventilator') {
          ctx.strokeStyle = isBp ? '#7dd3fc' : '#0284c7';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(xMid, ySill);
          ctx.lineTo(xMid, yHead);
          ctx.stroke();
        } else if (op.type === 'door') {
          // Open door swing indicator
          ctx.strokeStyle = isBp ? '#fbbf24' : '#d97706';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(xLeft, ySill);
          ctx.lineTo(xLeft, yHead);
          ctx.stroke();
        }
      }
    });

    // 4. Roof Cut Profile
    if (analysis.roofProfile) {
      const rp = analysis.roofProfile;
      const yEave = toScreenY(rp.eaveElevation);
      const yPeak = toScreenY(rp.peakElevation);

      const xL = leftBound - 30;
      const xR = rightBound + 30;
      const xC = (xL + xR) / 2;

      ctx.strokeStyle = cutLine;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (rp.type === 'shed') {
        ctx.moveTo(xL, yEave);
        ctx.lineTo(xR, yPeak);
      } else {
        // Gable / Hip peak
        ctx.moveTo(xL, yEave);
        ctx.lineTo(xC, yPeak);
        ctx.lineTo(xR, yEave);
      }
      ctx.stroke();

      // Ceiling Collar Tie / Truss Web Linework
      ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.4)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xL + 60, yEave);
      ctx.lineTo(xR - 60, yEave);
      ctx.moveTo((xL + xC) / 2, (yEave + yPeak) / 2);
      ctx.lineTo(xC, yEave);
      ctx.moveTo((xR + xC) / 2, (yEave + yPeak) / 2);
      ctx.lineTo(xC, yEave);
      ctx.stroke();
    }

    // 5. Room Labels Inside Section
    analysis.roomSegments.forEach((room) => {
      const rxMid = toScreenX((room.startDist + room.endDist) / 2);
      const topFloorH = project.floors[0].ceilingHeight || 1728;
      const ry = toScreenY(topFloorH / 2);

      ctx.fillStyle = textColor;
      ctx.font = '700 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.roomName.toUpperCase(), rxMid, ry);

      // Dimension span
      ctx.fillStyle = dimColor;
      ctx.font = '500 11px monospace';
      ctx.fillText(`CLEAR SPAN: ${formatFeetInches(room.width)}`, rxMid, ry + 18);
    });

    // 6. Left-Side Architectural Datum Elevation Markers
    const markerStartX = leftBound - 120;
    analysis.datumLevels.forEach((dl) => {
      const dy = toScreenY(dl.elevation);

      // Thin dashed datum extension line through drawing
      ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(markerStartX, dy);
      ctx.lineTo(rightBound + 80, dy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Datum Triangle Marker
      ctx.fillStyle = datumColor;
      ctx.beginPath();
      ctx.moveTo(markerStartX, dy);
      ctx.lineTo(markerStartX - 16, dy - 7);
      ctx.lineTo(markerStartX - 16, dy + 7);
      ctx.closePath();
      ctx.fill();

      // Elevation Callout & Name
      ctx.fillStyle = textColor;
      ctx.font = '700 11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(dl.formatted, markerStartX - 22, dy - 2);

      ctx.fillStyle = dimColor;
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(dl.name, markerStartX - 22, dy + 2);
    });

    // 7. Overall Width Dimension String at Bottom
    const dimY = groundY + 70;
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftBound, dimY);
    ctx.lineTo(rightBound, dimY);
    // Ticks
    ctx.moveTo(leftBound, dimY - 8);
    ctx.lineTo(leftBound, dimY + 8);
    ctx.moveTo(rightBound, dimY - 8);
    ctx.lineTo(rightBound, dimY + 8);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '700 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`TOTAL SECTION LENGTH: ${formatFeetInches(analysis.totalLength)}`, (leftBound + rightBound) / 2, dimY - 5);

    ctx.restore();

    // 8. Title Block Header / Sheet Tag on Canvas
    ctx.fillStyle = isBp ? '#38bdf8' : '#0f172a';
    ctx.font = '700 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(currentCut.name.toUpperCase(), 35, 45);

    ctx.fillStyle = isBp ? '#93c5fd' : '#64748b';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText(`SCALE: 1/4" = 1'-0" (1:50)  •  SHEET REF: ${currentCut.sheetRef || 'A-301'}  •  VIEW: LOOKING ${currentCut.viewDirection.toUpperCase()}`, 35, 68);

  }, [analysis, currentCut, project, theme, zoom]);

  useEffect(() => {
    if (isOpen) {
      drawSection();
    }
  }, [isOpen, drawSection]);

  if (!isOpen) return null;

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${project.name.replace(/\s+/g, '_')}_${currentCut.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleFlipDirection = () => {
    if (!onUpdateSectionCut) return;
    const nextDir = currentCut.viewDirection === 'left' ? 'right' : 'left';
    onUpdateSectionCut({ ...currentCut, viewDirection: nextDir });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '94vw',
          maxWidth: 1380,
          height: '92vh',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-panel-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Architectural Building Section Cut
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#38bdf8',
                    color: '#0f172a',
                  }}
                >
                  {currentCut.sheetRef || 'A-301'}
                </span>
              </div>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary)' }}>
                True vertical slice through foundation, slabs, walls, ceiling heights, and roof
              </p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Section Switcher */}
            {allSections.length > 1 && (
              <select
                value={selectedCutId}
                onChange={(e) => setSelectedCutId(e.target.value)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              >
                {allSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.sheetRef})
                  </option>
                ))}
              </select>
            )}

            {/* Flip Direction Button */}
            {onUpdateSectionCut && (
              <button
                onClick={handleFlipDirection}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Flip viewing direction left/right"
              >
                <ArrowLeftRight size={14} />
                Flip View ({currentCut.viewDirection.toUpperCase()})
              </button>
            )}

            {/* Theme Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 6, padding: 2, border: '1px solid var(--border-light)' }}>
              {(['blueprint', 'monochrome', 'presentation'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: 'none',
                    background: theme === t ? '#38bdf8' : 'transparent',
                    color: theme === t ? '#0f172a' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoom(1.0)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Reset Zoom"
              >
                <RotateCw size={14} />
              </button>
            </div>

            {/* Export Actions */}
            <button
              onClick={handleExportPNG}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              PNG
            </button>

            <button
              onClick={handlePrintPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} />
              Print PDF
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                padding: 6,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#060c18',
          }}
        >
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Footer info bar */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-panel-secondary)',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', gap: 20 }}>
            <span>Wall Cuts: <strong>{analysis.cutWalls.filter((w) => w.hitType === 'solid_wall').length} solid, {analysis.cutWalls.filter((w) => w.hitType === 'opening').length} openings</strong></span>
            <span>Traversed Rooms: <strong>{analysis.roomSegments.length} rooms</strong></span>
            <span>Building Height: <strong>{formatFeetInches(analysis.datumLevels[analysis.datumLevels.length - 1]?.elevation || 0)}</strong></span>
          </div>
          <div>
            <span>Section Reference: <strong>{currentCut.name} ({currentCut.sheetRef})</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
