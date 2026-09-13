import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Project, Floor, SectionCut } from '../core/model/types';
import { wallLength, wallAngle } from '../core/model/geometry';
import { formatFeetInches } from '../core/units';
import { computeRoomBoundingDimensions, computeRoomAreaSqFt } from '../core/model/roomDetection';
import { calculateMepTakeoff } from '../core/model/mep';
import { analyzeSectionCut, computeBuildingSectionDatums } from '../core/model/sections';
import {
  X,
  Download,
  Printer,
  Compass,
  FileText,
  Layers,
  Building2,
  Table,
  CheckCircle2,
  FolderDown,
} from 'lucide-react';

interface ExportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export type CDSheetId = 'A-001' | 'A-101' | 'A-102' | 'A-201' | 'A-301' | 'A-501';

interface CDSheetInfo {
  id: CDSheetId;
  title: string;
  subtitle: string;
  scale: string;
}

const CD_SHEETS: CDSheetInfo[] = [
  { id: 'A-001', title: 'COVER SHEET & DRAWING INDEX', subtitle: 'Project Directory, Code & Index', scale: 'N.T.S.' },
  { id: 'A-101', title: 'GROUND FLOOR ARCHITECTURAL PLAN', subtitle: 'Dimensioned Plan & Wall Layout', scale: '1/4" = 1\'-0"' },
  { id: 'A-102', title: 'UPPER FLOOR / ROOF TERRACE PLAN', subtitle: 'Level 2 & Roof Layout', scale: '1/4" = 1\'-0"' },
  { id: 'A-201', title: 'EXTERIOR BUILDING ELEVATIONS', subtitle: 'South & West Facades with Datums', scale: '1/4" = 1\'-0"' },
  { id: 'A-301', title: 'BUILDING LONGITUDINAL SECTION A-A\'', subtitle: 'Structural Cross-Section Cut', scale: '1/4" = 1\'-0"' },
  { id: 'A-501', title: 'ROOM SCHEDULE & MEP LOAD TAKEOFF', subtitle: 'Area Schedules & Electrical Takeoffs', scale: 'N.T.S.' },
];

export const ExportPlanModal: React.FC<ExportPlanModalProps> = ({ isOpen, onClose, project }) => {
  const [activeSheetId, setActiveSheetId] = useState<CDSheetId>('A-101');
  const [projectTitle, setProjectTitle] = useState(project.name || 'Modern Residence CD Set');
  const [clientName, setClientName] = useState('Private Client');
  const [designerName, setDesignerName] = useState('Studio Architecture & Design');
  const [theme, setTheme] = useState<'blueprint' | 'monochrome' | 'color'>('blueprint');
  const [paperSize, setPaperSize] = useState<'ArchD' | 'A3' | 'A4'>('ArchD');
  const [includeFurniture, setIncludeFurniture] = useState(true);
  const [includeRoomDimensions, setIncludeRoomDimensions] = useState(true);
  const [isBatchExporting, setIsBatchExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const secondFloor = project.floors.length > 1 ? project.floors[1] : null;

  // Schedules and MEP calculations
  const allSymbols = useMemo(() => project.floors.flatMap((f) => f.symbols || []), [project]);
  const mepTakeoff = useMemo(() => calculateMepTakeoff(allSymbols), [allSymbols]);

  const roomRows = useMemo(() => {
    const list: {
      index: number;
      roomName: string;
      floorName: string;
      dims: string;
      areaSqFt: number;
      perimeterFt: number;
      ceilingHt: string;
    }[] = [];
    let idx = 1;
    for (const floor of project.floors) {
      for (const room of floor.rooms) {
        if (room.polygon.length < 3) continue;
        const areaSqFt = computeRoomAreaSqFt(room.polygon);
        if (areaSqFt < 5) continue;
        const { widthFt, depthFt } = computeRoomBoundingDimensions(room.polygon);
        let peri = 0;
        for (let i = 0; i < room.polygon.length; i++) {
          const p1 = room.polygon[i];
          const p2 = room.polygon[(i + 1) % room.polygon.length];
          peri += Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        list.push({
          index: idx++,
          roomName: room.name,
          floorName: floor.name,
          dims: `${widthFt.toFixed(1)}' × ${depthFt.toFixed(1)}'`,
          areaSqFt: Math.round(areaSqFt),
          perimeterFt: Math.round(peri / 192),
          ceilingHt: formatFeetInches(floor.ceilingHeight || 1920),
        });
      }
    }
    return list;
  }, [project]);

  const totalAreaSqFt = useMemo(() => roomRows.reduce((sum, r) => sum + r.areaSqFt, 0), [roomRows]);

  // Unified Title Block Renderer
  const renderTitleBlock = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    margin: number,
    sheet: CDSheetInfo,
    isBp: boolean,
    borderColor: string,
    textColor: string,
    mutedText: string
  ) => {
    const tbWidth = 440;
    const tbHeight = 118;
    const tbX = W - margin - 5 - tbWidth;
    const tbY = H - margin - 5 - tbHeight;

    ctx.fillStyle = isBp ? '#081426' : '#ffffff';
    ctx.fillRect(tbX, tbY, tbWidth, tbHeight);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tbX, tbY, tbWidth, tbHeight);

    // Project Name
    ctx.fillStyle = textColor;
    ctx.font = 'bold 15px "SF Pro Display", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(projectTitle.toUpperCase(), tbX + 16, tbY + 26);

    // Sheet Name
    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
    ctx.fillText(`SHEET: ${sheet.title}`, tbX + 16, tbY + 48);

    // Client & Designer
    ctx.font = '500 10.5px monospace';
    ctx.fillStyle = mutedText;
    ctx.fillText(`CLIENT: ${clientName}  |  DESIGNER: ${designerName}`, tbX + 16, tbY + 70);

    // Date & Scale
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}  |  SCALE: ${sheet.scale}`, tbX + 16, tbY + 92);

    // Sheet Stamp
    const stampW = 85;
    ctx.strokeRect(tbX + tbWidth - stampW, tbY, stampW, tbHeight);
    ctx.font = 'bold 22px "SF Pro Display", sans-serif';
    ctx.fillStyle = isBp ? '#38bdf8' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(sheet.id, tbX + tbWidth - stampW / 2, tbY + 54);
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = mutedText;
    ctx.fillText('SHEET NO.', tbX + tbWidth - stampW / 2, tbY + 76);
    ctx.textAlign = 'left';
  };

  // Render Sheet Canvas
  const drawSheet = useCallback(
    (sheetId: CDSheetId, customCanvas?: HTMLCanvasElement) => {
      const canvas = customCanvas || canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const sheet = CD_SHEETS.find((s) => s.id === sheetId) || CD_SHEETS[1];

      // Colors
      const isBp = theme === 'blueprint';
      const isMono = theme === 'monochrome';
      const bgColor = isBp ? '#0c1b33' : isMono ? '#ffffff' : '#f8fafc';
      const gridColor = isBp ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 0, 0, 0.04)';
      const borderColor = isBp ? '#38bdf8' : '#1e293b';
      const textColor = isBp ? '#f0f9ff' : '#0f172a';
      const mutedText = isBp ? '#93c5fd' : '#64748b';

      // 1. Background & CAD Grid
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      const gridSize = 40;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // 2. Borders
      const margin = 36;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);
      ctx.lineWidth = 0.8;
      ctx.strokeRect(margin + 6, margin + 6, W - (margin + 6) * 2, H - (margin + 6) * 2);

      // 3. Title Block
      renderTitleBlock(ctx, W, H, margin, sheet, isBp, borderColor, textColor, mutedText);

      // Sheet-specific rendering
      if (sheetId === 'A-001') {
        // ==========================================
        // SHEET A-001: COVER SHEET & DRAWING INDEX
        // ==========================================
        ctx.save();
        // Project Title
        ctx.font = 'bold 36px "SF Pro Display", sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText(projectTitle.toUpperCase(), margin + 50, margin + 90);

        ctx.font = '600 16px sans-serif';
        ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
        ctx.fillText('CONSTRUCTION DOCUMENTS & ARCHITECTURAL SPECIFICATIONS', margin + 50, margin + 120);

        ctx.font = '500 12px monospace';
        ctx.fillStyle = mutedText;
        ctx.fillText(`LOCATION: SITE PARCEL 04-A • COMPREHENSIVE SUBMISSION SET`, margin + 50, margin + 144);

        // Drawing Index Box (Left Half)
        const tblX = margin + 50;
        const tblY = margin + 180;
        const tblW = 760;
        const rowH = 34;

        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(tblX, tblY, tblW, 38 + CD_SHEETS.length * rowH);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tblX, tblY, tblW, 38 + CD_SHEETS.length * rowH);

        // Table Header
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.18)' : '#f1f5f9';
        ctx.fillRect(tblX, tblY, tblW, 38);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText('SHEET', tblX + 20, tblY + 24);
        ctx.fillText('DRAWING TITLE', tblX + 110, tblY + 24);
        ctx.fillText('SCALE', tblX + 540, tblY + 24);
        ctx.fillText('REV', tblX + 680, tblY + 24);

        CD_SHEETS.forEach((s, idx) => {
          const ry = tblY + 38 + idx * rowH;
          ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(tblX, ry);
          ctx.lineTo(tblX + tblW, ry);
          ctx.stroke();

          ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(s.id, tblX + 20, ry + 22);

          ctx.fillStyle = textColor;
          ctx.font = '500 12px sans-serif';
          ctx.fillText(s.title, tblX + 110, ry + 22);

          ctx.fillStyle = mutedText;
          ctx.font = '11px monospace';
          ctx.fillText(s.scale, tblX + 540, ry + 22);
          ctx.fillText('01', tblX + 685, ry + 22);
        });

        // Right Half: Project Directory & Code Compliance Summary
        const dirX = margin + 860;
        const dirY = margin + 180;
        const dirW = W - dirX - margin - 40;

        // Project Directory
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(dirX, dirY, dirW, 160);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(dirX, dirY, dirW, 160);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('PROJECT DIRECTORY', dirX + 20, dirY + 30);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = mutedText;
        ctx.fillText(`CLIENT: ${clientName}`, dirX + 20, dirY + 58);
        ctx.fillText(`ARCHITECTURAL DESIGN: ${designerName}`, dirX + 20, dirY + 80);
        ctx.fillText(`STRUCTURAL ENGINEER: Axis Engineering Group`, dirX + 20, dirY + 102);
        ctx.fillText(`BUILDING CODE: 2024 International Residential Code (IRC)`, dirX + 20, dirY + 124);

        // Building Data Summary
        const bldY = dirY + 180;
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(dirX, bldY, dirW, 190);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(dirX, bldY, dirW, 190);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('BUILDING DATA & CODE INFORMATION', dirX + 20, bldY + 30);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = mutedText;
        ctx.fillText(`OCCUPANCY CLASSIFICATION: R-3 (Single Family Residential)`, dirX + 20, bldY + 60);
        ctx.fillText(`CONSTRUCTION TYPE: Type V-B (Combustible / Wood Frame)`, dirX + 20, bldY + 82);
        ctx.fillText(`NUMBER OF STORIES: ${project.floors.length} Story`, dirX + 20, bldY + 104);
        ctx.fillText(`TOTAL GROSS FLOOR AREA: ${totalAreaSqFt} SQ FT`, dirX + 20, bldY + 126);
        ctx.fillText(`FIRE SPRINKLERS: NFPA 13D Compliant System Required`, dirX + 20, bldY + 148);

        ctx.restore();
      } else if (sheetId === 'A-101' || sheetId === 'A-102') {
        // ==========================================
        // SHEET A-101 & A-102: FLOOR PLANS
        // ==========================================
        const targetFloor = sheetId === 'A-101' ? activeFloor : secondFloor || activeFloor;

        // North Arrow
        const naX = W - margin - 50;
        const naY = margin + 55;
        ctx.save();
        ctx.translate(naX, naY);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(5, 10);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.fillText('N', 0, -25);
        ctx.restore();

        // Scale bar
        const sbX = margin + 24;
        const sbY = H - margin - 35;
        ctx.save();
        ctx.font = '600 10px monospace';
        ctx.fillStyle = mutedText;
        ctx.fillText('GRAPHIC SCALE: 0\' — 5\' — 10\' — 20\'', sbX, sbY - 12);
        for (let s = 0; s < 4; s++) {
          ctx.fillStyle = s % 2 === 0 ? (isBp ? '#38bdf8' : '#0f172a') : isBp ? '#ffffff' : '#e2e8f0';
          ctx.fillRect(sbX + s * 35, sbY, 35, 6);
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sbX + s * 35, sbY, 35, 6);
        }
        ctx.restore();

        if (targetFloor.walls.length === 0) {
          ctx.font = '500 14px sans-serif';
          ctx.fillStyle = mutedText;
          ctx.textAlign = 'center';
          ctx.fillText(`No wall geometry modeled on ${targetFloor.name}.`, W / 2, H / 2);
          return;
        }

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const w of targetFloor.walls) {
          minX = Math.min(minX, w.start.x, w.end.x);
          minY = Math.min(minY, w.start.y, w.end.y);
          maxX = Math.max(maxX, w.start.x, w.end.x);
          maxY = Math.max(maxY, w.start.y, w.end.y);
        }
        const pad = 1200;
        const worldW = Math.max(1, maxX - minX + pad * 2);
        const worldH = Math.max(1, maxY - minY + pad * 2);

        const viewLeft = margin + 40;
        const viewTop = margin + 40;
        const viewW = W - margin * 2 - 80;
        const viewH = H - margin * 2 - 150;

        const scale = Math.min(viewW / worldW, viewH / worldH);
        const originX = viewLeft + (viewW - worldW * scale) / 2 + pad * scale;
        const originY = viewTop + (viewH - worldH * scale) / 2 + pad * scale;

        const toScreen = (wx: number, wy: number) => ({
          x: originX + (wx - minX) * scale,
          y: originY + (wy - minY) * scale,
        });

        // Rooms
        for (const room of targetFloor.rooms) {
          if (room.polygon.length >= 3) {
            ctx.beginPath();
            const p0 = toScreen(room.polygon[0].x, room.polygon[0].y);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < room.polygon.length; i++) {
              const pt = toScreen(room.polygon[i].x, room.polygon[i].y);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.fillStyle = isBp
              ? 'rgba(56, 189, 248, 0.05)'
              : isMono
              ? 'rgba(0, 0, 0, 0.02)'
              : 'rgba(241, 245, 249, 0.7)';
            ctx.fill();

            const center = room.polygon.reduce(
              (acc, p) => ({ x: acc.x + p.x / room.polygon.length, y: acc.y + p.y / room.polygon.length }),
              { x: 0, y: 0 }
            );
            const sc = toScreen(center.x, center.y);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.fillText(room.name.toUpperCase(), sc.x, sc.y - (includeRoomDimensions ? 8 : 0));

            if (includeRoomDimensions && room.computedAreaSqFt) {
              ctx.font = '500 10px monospace';
              ctx.fillStyle = isBp ? '#7dd3fc' : '#475569';
              ctx.fillText(`${room.computedAreaSqFt} SQ FT`, sc.x, sc.y + 8);
            }
          }
        }

        // Walls
        for (const wall of targetFloor.walls) {
          const s = toScreen(wall.start.x, wall.start.y);
          const e = toScreen(wall.end.x, wall.end.y);
          const thick = Math.max(3, (wall.thickness || 96) * scale);

          ctx.strokeStyle = isBp ? '#38bdf8' : isMono ? '#000000' : '#1e293b';
          ctx.lineWidth = thick;
          ctx.lineCap = 'square';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Cut openings
          for (const op of wall.openings) {
            const angle = wallAngle(wall);
            const opStartWorldX = wall.start.x + Math.cos(angle) * (op.offsetAlongWall - op.width / 2);
            const opStartWorldY = wall.start.y + Math.sin(angle) * (op.offsetAlongWall - op.width / 2);
            const opEndWorldX = wall.start.x + Math.cos(angle) * (op.offsetAlongWall + op.width / 2);
            const opEndWorldY = wall.start.y + Math.sin(angle) * (op.offsetAlongWall + op.width / 2);

            const opS = toScreen(opStartWorldX, opStartWorldY);
            const opE = toScreen(opEndWorldX, opEndWorldY);

            ctx.strokeStyle = bgColor;
            ctx.lineWidth = thick + 1;
            ctx.beginPath();
            ctx.moveTo(opS.x, opS.y);
            ctx.lineTo(opE.x, opE.y);
            ctx.stroke();

            // Opening lines
            ctx.strokeStyle = op.type === 'door' ? (isBp ? '#38bdf8' : '#d97706') : isBp ? '#7dd3fc' : '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(opS.x, opS.y);
            ctx.lineTo(opE.x, opE.y);
            ctx.stroke();
          }
        }

        // Section Cut Callouts (Sheet A-101 only)
        if (sheetId === 'A-101') {
          for (const cut of targetFloor.sections || []) {
            const s1 = toScreen(cut.p1.x, cut.p1.y);
            const s2 = toScreen(cut.p2.x, cut.p2.y);
            const cdx = s2.x - s1.x;
            const cdy = s2.y - s1.y;
            const clen = Math.hypot(cdx, cdy);
            if (clen < 15) continue;

            const cnx = -cdy / clen;
            const cny = cdx / clen;
            const csign = cut.viewDirection === 'right' ? 1 : -1;

            ctx.save();
            ctx.strokeStyle = isBp ? '#38bdf8' : '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 4, 3, 4]);
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            [s1, s2].forEach((pt) => {
              const bR = 13;
              const aTipX = pt.x + csign * cnx * (bR + 14);
              const aTipY = pt.y + csign * cny * (bR + 14);

              // Arrow
              ctx.strokeStyle = isBp ? '#38bdf8' : '#2563eb';
              ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(aTipX, aTipY);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(aTipX, aTipY, 3, 0, Math.PI * 2);
              ctx.fill();

              // Bubble
              ctx.fillStyle = isBp ? '#081426' : '#ffffff';
              ctx.strokeStyle = isBp ? '#38bdf8' : '#2563eb';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, bR, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(pt.x - bR, pt.y);
              ctx.lineTo(pt.x + bR, pt.y);
              ctx.stroke();

              ctx.font = 'bold 9px sans-serif';
              ctx.fillStyle = textColor;
              ctx.textAlign = 'center';
              ctx.fillText(cut.label || 'A', pt.x, pt.y - 4);
              ctx.fillStyle = mutedText;
              ctx.font = 'bold 7px sans-serif';
              ctx.fillText(cut.sheetRef || 'A-301', pt.x, pt.y + 6);
            });
            ctx.restore();
          }
        }
      } else if (sheetId === 'A-201') {
        // ==========================================
        // SHEET A-201: EXTERIOR BUILDING ELEVATIONS
        // ==========================================
        ctx.save();
        ctx.font = 'bold 18px "SF Pro Display", sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('EXTERIOR BUILDING ELEVATIONS (SOUTH & WEST)', margin + 40, margin + 40);

        const elevBoxW = W - margin * 2 - 80;
        const elevH = (H - margin * 2 - 200) / 2;

        // Elevation 1: South Facade
        const e1Y = margin + 70;
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(margin + 40, e1Y, elevBoxW, elevH);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(margin + 40, e1Y, elevBoxW, elevH);

        // Ground line
        const g1Y = e1Y + elevH - 45;
        ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(margin + 60, g1Y);
        ctx.lineTo(margin + 40 + elevBoxW - 60, g1Y);
        ctx.stroke();

        // Building facade box
        const bW = elevBoxW * 0.65;
        const bX = margin + 40 + (elevBoxW - bW) / 2;
        const bH = elevH * 0.62;
        const bTop = g1Y - bH;

        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.08)' : '#f1f5f9';
        ctx.fillRect(bX, bTop, bW, bH);
        ctx.strokeStyle = isBp ? '#38bdf8' : '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(bX, bTop, bW, bH);

        // Roof slope triangle
        ctx.beginPath();
        ctx.moveTo(bX - 25, bTop);
        ctx.lineTo(bX + bW / 2, bTop - 45);
        ctx.lineTo(bX + bW + 25, bTop);
        ctx.closePath();
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.15)' : '#e2e8f0';
        ctx.fill();
        ctx.stroke();

        // Facade Windows & Entry Door
        const doorW = 34;
        const doorH = 65;
        ctx.fillStyle = isBp ? '#38bdf8' : '#d97706';
        ctx.fillRect(bX + bW / 2 - doorW / 2, g1Y - doorH, doorW, doorH);

        for (let i = 0; i < 4; i++) {
          const winX = bX + 50 + i * (bW / 4.5);
          ctx.fillStyle = isBp ? '#7dd3fc' : '#0284c7';
          ctx.fillRect(winX, bTop + 35, 45, 50);
          ctx.strokeStyle = isBp ? '#ffffff' : '#0f172a';
          ctx.strokeRect(winX, bTop + 35, 45, 50);
        }

        // Datum Markers
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
        ctx.fillText('▲ ROOF RIDGE +22\'-6"', bX - 170, bTop - 45);
        ctx.fillText('▲ LEVEL 02 +10\'-0"', bX - 170, bTop + bH / 2);
        ctx.fillText('▲ GROUND FLOOR +0\'-0"', bX - 170, g1Y);

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('1. SOUTH EXTERIOR ELEVATION', margin + 60, e1Y + 30);

        // Elevation 2: West Facade
        const e2Y = e1Y + elevH + 20;
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(margin + 40, e2Y, elevBoxW, elevH);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(margin + 40, e2Y, elevBoxW, elevH);

        const g2Y = e2Y + elevH - 45;
        ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(margin + 60, g2Y);
        ctx.lineTo(margin + 40 + elevBoxW - 60, g2Y);
        ctx.stroke();

        const b2W = elevBoxW * 0.55;
        const b2X = margin + 40 + (elevBoxW - b2W) / 2;
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.08)' : '#f1f5f9';
        ctx.fillRect(b2X, g2Y - bH, b2W, bH);
        ctx.strokeStyle = isBp ? '#38bdf8' : '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(b2X, g2Y - bH, b2W, bH);

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('2. WEST EXTERIOR ELEVATION', margin + 60, e2Y + 30);
        ctx.restore();
      } else if (sheetId === 'A-301') {
        // ==========================================
        // SHEET A-301: BUILDING LONGITUDINAL SECTION
        // ==========================================
        const firstCut: SectionCut = activeFloor.sections?.[0] || {
          id: 'default-sec',
          name: 'Section A-A',
          label: 'A',
          sheetRef: 'A-301',
          p1: { x: 960, y: 1920 },
          p2: { x: 7680, y: 1920 },
          viewDirection: 'left',
        };
        const analysis = analyzeSectionCut(firstCut, project);

        ctx.save();
        ctx.font = 'bold 18px "SF Pro Display", sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText(`BUILDING LONGITUDINAL SECTION ${firstCut.label}-${firstCut.label}'`, margin + 40, margin + 40);

        const secBoxW = W - margin * 2 - 80;
        const secBoxH = H - margin * 2 - 180;
        const secBoxX = margin + 40;
        const secBoxY = margin + 60;

        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(secBoxX, secBoxY, secBoxW, secBoxH);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(secBoxX, secBoxY, secBoxW, secBoxH);

        const gY = secBoxY + secBoxH - 80;
        const sLeft = secBoxX + 180;
        const sRight = secBoxX + secBoxW - 80;
        const totalCutSpan = Math.max(1, analysis.totalLength);
        const secScale = (sRight - sLeft) / totalCutSpan;

        // Earth hatch
        ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let x = sLeft - 60; x < sRight + 60; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, gY);
          ctx.lineTo(x - 20, gY + 30);
          ctx.stroke();
        }

        // Concrete Foundation & Slab
        ctx.fillStyle = isBp ? '#1e3a8a' : '#cbd5e1';
        ctx.fillRect(sLeft - 20, gY - 12, sRight - sLeft + 40, 16);
        ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(sLeft - 20, gY - 12, sRight - sLeft + 40, 16);

        // Render Cut Walls & Openings
        const floorH = 140; // Screen px
        analysis.cutWalls.forEach((cw) => {
          const wx = sLeft + cw.distanceAlongCut * secScale;
          const wThickPx = Math.max(8, (cw.wallThickness || 96) * secScale);
          const wy = gY - 12 - floorH;

          if (cw.hitType === 'solid_wall') {
            ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.25)' : '#94a3b8';
            ctx.fillRect(wx - wThickPx / 2, wy, wThickPx, floorH);
            ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(wx - wThickPx / 2, wy, wThickPx, floorH);

            // 45 deg cross-hatching
            ctx.save();
            ctx.beginPath();
            ctx.rect(wx - wThickPx / 2, wy, wThickPx, floorH);
            ctx.clip();
            ctx.strokeStyle = isBp ? '#38bdf8' : '#475569';
            ctx.lineWidth = 1;
            for (let hy = wy - 40; hy < wy + floorH + 40; hy += 10) {
              ctx.beginPath();
              ctx.moveTo(wx - wThickPx / 2 - 20, hy);
              ctx.lineTo(wx + wThickPx / 2 + 20, hy - 40);
              ctx.stroke();
            }
            ctx.restore();
          } else {
            // Cut door or window opening
            ctx.strokeStyle = isBp ? '#7dd3fc' : '#0284c7';
            ctx.lineWidth = 2;
            ctx.strokeRect(wx - wThickPx / 2, wy, wThickPx, floorH);
            ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(cw.opening?.type === 'door' ? 'DOOR' : 'WINDOW', wx - 12, wy + floorH / 2);
          }
        });

        // Roof Rafters & Ceiling Slab
        const ceilingY = gY - 12 - floorH;
        ctx.fillStyle = isBp ? '#1e3a8a' : '#cbd5e1';
        ctx.fillRect(sLeft - 20, ceilingY - 10, sRight - sLeft + 40, 10);
        ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.strokeRect(sLeft - 20, ceilingY - 10, sRight - sLeft + 40, 10);

        // Roof Profile
        const apexY = ceilingY - 60;
        const midX = (sLeft + sRight) / 2;
        ctx.beginPath();
        ctx.moveTo(sLeft - 30, ceilingY);
        ctx.lineTo(midX, apexY);
        ctx.lineTo(sRight + 30, ceilingY);
        ctx.closePath();
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.12)' : '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = isBp ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Datums
        analysis.datumLevels.forEach((d) => {
          const dy = gY - 12 - (d.elevation / 1920) * floorH;
          ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`▲ ${d.name} (${d.formatted})`, secBoxX + 16, dy);

          ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.1)';
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(secBoxX + 160, dy);
          ctx.lineTo(sRight + 40, dy);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        ctx.restore();
      } else if (sheetId === 'A-501') {
        // ==========================================
        // SHEET A-501: ROOM SCHEDULE & MEP TAKEOFF
        // ==========================================
        ctx.save();
        ctx.font = 'bold 18px "SF Pro Display", sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('ROOM AREA SCHEDULE & MEP ELECTRICAL LOAD TAKEOFF', margin + 40, margin + 40);

        // Top Half: Room Schedule Table
        const tblX = margin + 40;
        const tblY = margin + 65;
        const tblW = W - margin * 2 - 80;
        const rowH = 26;

        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(tblX, tblY, tblW, 30 + Math.min(10, roomRows.length) * rowH + 30);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tblX, tblY, tblW, 30 + Math.min(10, roomRows.length) * rowH + 30);

        // Table Header
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.18)' : '#f1f5f9';
        ctx.fillRect(tblX, tblY, tblW, 30);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px monospace';
        ctx.fillText('#', tblX + 16, tblY + 20);
        ctx.fillText('ROOM NAME', tblX + 50, tblY + 20);
        ctx.fillText('LEVEL', tblX + 260, tblY + 20);
        ctx.fillText('DIMENSIONS (W × D)', tblX + 420, tblY + 20);
        ctx.fillText('AREA (SQ FT)', tblX + 680, tblY + 20);
        ctx.fillText('PERIMETER', tblX + 850, tblY + 20);
        ctx.fillText('CEILING HT', tblX + 1010, tblY + 20);

        roomRows.slice(0, 10).forEach((r, idx) => {
          const ry = tblY + 30 + idx * rowH;
          ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.15)' : '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(tblX, ry);
          ctx.lineTo(tblX + tblW, ry);
          ctx.stroke();

          ctx.fillStyle = mutedText;
          ctx.font = '11px monospace';
          ctx.fillText(String(r.index), tblX + 16, ry + 18);
          ctx.fillStyle = textColor;
          ctx.fillText(r.roomName, tblX + 50, ry + 18);
          ctx.fillStyle = mutedText;
          ctx.fillText(r.floorName, tblX + 260, ry + 18);
          ctx.fillText(r.dims, tblX + 420, ry + 18);
          ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`${r.areaSqFt} SQ FT`, tblX + 680, ry + 18);
          ctx.font = '11px monospace';
          ctx.fillStyle = mutedText;
          ctx.fillText(`${r.perimeterFt} LF`, tblX + 850, ry + 18);
          ctx.fillText(r.ceilingHt, tblX + 1010, ry + 18);
        });

        // Bottom Half: MEP Fixture Schedule
        const mepY = tblY + 30 + Math.min(10, roomRows.length) * rowH + 50;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('MEP ELECTRICAL FIXTURE TAKEOFF & CONNECTED LOAD', tblX, mepY);

        const mepTblY = mepY + 14;
        const mepRows = mepTakeoff.itemized;
        ctx.fillStyle = isBp ? '#081426' : '#ffffff';
        ctx.fillRect(tblX, mepTblY, tblW, 30 + Math.max(1, mepRows.length) * rowH);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(tblX, mepTblY, tblW, 30 + Math.max(1, mepRows.length) * rowH);

        // Header
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.18)' : '#f1f5f9';
        ctx.fillRect(tblX, mepTblY, tblW, 30);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px monospace';
        ctx.fillText('FIXTURE DESCRIPTION', tblX + 20, mepTblY + 20);
        ctx.fillText('CATEGORY', tblX + 320, mepTblY + 20);
        ctx.fillText('QTY', tblX + 540, mepTblY + 20);
        ctx.fillText('UNIT LOAD', tblX + 680, mepTblY + 20);
        ctx.fillText('TOTAL CONNECTED LOAD', tblX + 880, mepTblY + 20);

        if (mepRows.length === 0) {
          ctx.fillStyle = mutedText;
          ctx.font = '11px sans-serif';
          ctx.fillText('No electrical/lighting symbols placed yet. Use MEP Tool to place fixtures.', tblX + 20, mepTblY + 50);
        } else {
          mepRows.forEach((item, idx) => {
            const ry = mepTblY + 30 + idx * rowH;
            ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.15)' : '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(tblX, ry);
            ctx.lineTo(tblX + tblW, ry);
            ctx.stroke();

            const unitWatts = Math.round(item.totalWatts / item.count);
            ctx.fillStyle = textColor;
            ctx.font = '500 11px sans-serif';
            ctx.fillText(item.name, tblX + 20, ry + 18);
            ctx.fillStyle = mutedText;
            ctx.font = '11px monospace';
            ctx.fillText(item.category.toUpperCase(), tblX + 320, ry + 18);
            ctx.fillStyle = isBp ? '#38bdf8' : '#2563eb';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(String(item.count), tblX + 540, ry + 18);
            ctx.fillStyle = mutedText;
            ctx.font = '11px monospace';
            ctx.fillText(`${unitWatts} W`, tblX + 680, ry + 18);
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = textColor;
            ctx.fillText(`${item.totalWatts} W (${(item.totalWatts / 120).toFixed(1)} A)`, tblX + 880, ry + 18);
          });
        }
        ctx.restore();
      }
    },
    [
      theme,
      projectTitle,
      clientName,
      designerName,
      activeFloor,
      secondFloor,
      project,
      includeRoomDimensions,
      includeFurniture,
      roomRows,
      totalAreaSqFt,
      mepTakeoff,
    ]
  );

  useEffect(() => {
    if (isOpen) {
      drawSheet(activeSheetId);
    }
  }, [isOpen, activeSheetId, drawSheet]);

  // Export current active sheet as PNG
  const handleDownloadSheet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${projectTitle.replace(/\s+/g, '_')}_${activeSheetId}.png`;
    link.href = url;
    link.click();
  };

  // Batch Export Complete CD Set
  const handleBatchExport = async () => {
    setIsBatchExporting(true);
    for (let i = 0; i < CD_SHEETS.length; i++) {
      const s = CD_SHEETS[i];
      setActiveSheetId(s.id);
      await new Promise((res) => setTimeout(res, 250));
      const canvas = canvasRef.current;
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${projectTitle.replace(/\s+/g, '_')}_${s.id}.png`;
        link.href = url;
        link.click();
      }
    }
    setIsBatchExporting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1600,
          height: '92vh',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: 14,
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-medium)',
            background: 'var(--bg-toolbar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Construction Document (CD Set) Publisher
              </h2>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Multi-Sheet Architectural CD Book • Standards Compliant Plan, Elevations, Sections & Schedules
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleBatchExport}
              disabled={isBatchExporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 7,
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: isBatchExporting ? 'not-allowed' : 'pointer',
                opacity: isBatchExporting ? 0.7 : 1,
              }}
            >
              <FolderDown size={14} />
              {isBatchExporting ? 'Exporting CD Set...' : 'Batch Export Complete Set'}
            </button>

            <button
              onClick={handleDownloadSheet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 7,
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Download Sheet (PNG)
            </button>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 7,
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} />
              Print PDF
            </button>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Workspace Body: Sidebar + Canvas Viewport */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sheet Selector & Settings Sidebar */}
          <div
            style={{
              width: 340,
              borderRight: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-sidebar)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto',
            }}
          >
            {/* Sheet Browser */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                CD Drawing Sheets
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {CD_SHEETS.map((s) => {
                  const isActive = activeSheetId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSheetId(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 8,
                        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-card)',
                        border: `1px solid ${isActive ? '#2563eb' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: isActive ? '#2563eb' : 'rgba(255,255,255,0.08)',
                              color: isActive ? '#ffffff' : 'var(--text-secondary)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {s.id}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? '#2563eb' : 'var(--text-primary)',
                            }}
                          >
                            {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                          {s.subtitle}
                        </div>
                      </div>
                      {isActive && <CheckCircle2 size={15} color="#2563eb" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Block Settings */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                Title Block Metadata
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Project Title</span>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Client Name</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Architectural Designer</span>
                  <input
                    type="text"
                    value={designerName}
                    onChange={(e) => setDesignerName(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rendering Theme */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                Visual Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
                {(['blueprint', 'monochrome', 'color'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: 6,
                      border: `1px solid ${theme === t ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      backgroundColor: theme === t ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                      color: theme === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: 12,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              📐 Architectural CD Set formatted with uniform sheet margins, stamps, North arrows, and graphic scale bars.
            </div>
          </div>

          {/* Sheet Canvas Preview */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#070a13',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              width={1600}
              height={1000}
              style={{
                width: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 4,
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
