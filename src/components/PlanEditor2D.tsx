import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Project,
  Floor,
  Wall,
  WallOpening,
  Point2D,
  Staircase,
  Column,
  Roof,
  FurnitureInstance,
  ArchitecturalSymbol,
  SymbolType,
  SectionCut,
  Room,
  SitePlan,
  OutdoorFeature,
  KitchenDesign,
} from '../core/model/types';
import { computeLotPolygon, computeSetbackPolygon } from '../core/model/site';
import { computeFloorBoundingBox } from '../core/model/vastu';
import { DEFAULT_MATERIALS } from '../core/model/defaults';
import { CADTool } from './Toolbar2D';
import {
  Sixteenths,
  SIXTEENTHS_PER_FOOT,
  formatFeetInches,
  snapSixteenths,
  feetInchesToSixteenths,
} from '../core/units';
import {
  distance2D,
  wallLength,
  wallAngle,
  projectPointOntoSegment,
  rotateWallAroundMidpoint,
} from '../core/model/geometry';
import {
  computeMiteredWallPolygons,
  getConnectedWallsAtPoint,
} from '../core/model/wallJoin';
import { calculateCADSnap, AlignmentGuide } from '../core/model/snapping';
import { isPointInsidePolygon } from '../core/model/roomDetection';
import {
  isPointInsideColumn,
  createDefaultColumn,
  getColumnFootprint,
} from '../core/model/columns';
import {
  createDefaultStaircase,
  getStaircaseFootprint,
  getStairTreadLines,
} from '../core/model/staircase';
import { getFloorRise } from '../core/model/floors';
import { getRoof2DGeometry } from '../core/model/roof';
import {
  isPointInsideFurniture,
  getFurnitureFootprint,
  createFurnitureInstance,
  FURNITURE_CATALOG,
} from '../core/model/furniture';
import { getPointDistance } from '../core/model/referencePlan';
import { MEP_CATALOG, createDefaultMepSymbol } from '../core/model/mep';
import { Info } from 'lucide-react';

function isPointInPoly(pt: Point2D, poly: Point2D[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getSelectedObjectCenter(
  activeFloor: Floor,
  selectedFurnitureId: string | null,
  selectedColumnId: string | null,
  selectedStairId: string | null,
  selectedWallId: string | null,
  selectedSymbolId: string | null = null
): { center: Point2D; angle: number; boundHalfH: number; type: 'furniture' | 'column' | 'stair' | 'wall' | 'symbol' } | null {
  if (selectedSymbolId) {
    const s = (activeFloor.symbols || []).find((it) => it.id === selectedSymbolId);
    if (s) {
      return {
        center: { x: s.position.x, y: s.position.y },
        angle: s.rotation,
        boundHalfH: 150,
        type: 'symbol',
      };
    }
  }
  if (selectedFurnitureId) {
    const f = (activeFloor.furniture || []).find((it) => it.id === selectedFurnitureId);
    if (f) {
      return {
        center: { x: f.position.x, y: f.position.y },
        angle: f.rotation,
        boundHalfH: Math.max(f.dimensions.width, f.dimensions.depth) / 2,
        type: 'furniture',
      };
    }
  }
  if (selectedColumnId) {
    const c = (activeFloor.columns || []).find((it) => it.id === selectedColumnId);
    if (c) {
      return {
        center: { x: c.position.x, y: c.position.y },
        angle: c.rotation || 0,
        boundHalfH: Math.max(c.width, c.depth) / 2,
        type: 'column',
      };
    }
  }
  if (selectedStairId) {
    const s = (activeFloor.stairs || []).find((it) => it.id === selectedStairId);
    if (s) {
      const fp = getStaircaseFootprint(s);
      if (fp.length > 0) {
        const cx = Math.round(fp.reduce((acc, p) => acc + p.x, 0) / fp.length);
        const cy = Math.round(fp.reduce((acc, p) => acc + p.y, 0) / fp.length);
        return {
          center: { x: cx, y: cy },
          angle: s.angle,
          boundHalfH: 350,
          type: 'stair',
        };
      }
    }
  }
  if (selectedWallId) {
    const w = activeFloor.walls.find((it) => it.id === selectedWallId);
    if (w) {
      return {
        center: {
          x: Math.round((w.start.x + w.end.x) / 2),
          y: Math.round((w.start.y + w.end.y) / 2),
        },
        angle: wallAngle(w),
        boundHalfH: w.thickness / 2 + 100,
        type: 'wall',
      };
    }
  }
  return null;
}

function render2DMepSymbol(
  ctx: CanvasRenderingContext2D,
  sym: ArchitecturalSymbol,
  screenPos: { x: number; y: number },
  isSelected: boolean,
  zoom: number
) {
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(-sym.rotation);

  if (isSelected) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
    ctx.fill();
  }

  switch (sym.type) {
    case 'light_point': {
      ctx.fillStyle = isSelected ? '#fde68a' : '#fef3c7';
      ctx.strokeStyle = isSelected ? '#d97706' : '#b45309';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.moveTo(-6, 6);
      ctx.lineTo(6, -6);
      ctx.stroke();
      break;
    }
    case 'fan_point': {
      ctx.fillStyle = '#cffafe';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      for (let b = 0; b < 3; b++) {
        const ang = (b * 2 * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 4, Math.sin(ang) * 4);
        ctx.quadraticCurveTo(
          Math.cos(ang + 0.5) * 11,
          Math.sin(ang + 0.5) * 11,
          Math.cos(ang) * 14,
          Math.sin(ang) * 14
        );
        ctx.stroke();
      }
      break;
    }
    case 'switchboard': {
      ctx.fillStyle = '#e0e7ff';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-12, -6, 24, 12);
      ctx.strokeRect(-12, -6, 24, 12);

      ctx.beginPath();
      [-5, 0, 5].forEach((sx) => {
        ctx.moveTo(sx, -4);
        ctx.lineTo(sx, 4);
      });
      ctx.stroke();
      break;
    }
    case 'socket_outlet': {
      ctx.fillStyle = '#ffedd5';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-4, -6);
      ctx.moveTo(4, 0);
      ctx.lineTo(4, -6);
      ctx.stroke();
      break;
    }
    case 'ac_indoor': {
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-18, -7, 36, 14);
      ctx.strokeRect(-18, -7, 36, 14);

      ctx.beginPath();
      [-7, 1].forEach((lx) => {
        ctx.moveTo(lx, -3);
        ctx.lineTo(lx + 4, 0);
        ctx.lineTo(lx, 3);
      });
      ctx.stroke();
      break;
    }
    case 'db_board': {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeRect(-10, -10, 20, 20);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'water_tap': {
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -13);
      ctx.lineTo(5, -13);
      ctx.stroke();
      break;
    }
    case 'geyser': {
      ctx.fillStyle = '#ffe4e6';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'drain_point': {
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);

      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.moveTo(-6, 6);
      ctx.lineTo(6, -6);
      ctx.stroke();
      break;
    }
  }

  if (zoom >= 0.75) {
    ctx.font = '700 8.5px sans-serif';
    ctx.fillStyle = isSelected ? '#1d4ed8' : '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tag = sym.circuit || (MEP_CATALOG.find((c) => c.type === sym.type)?.symbolCode || sym.name);
    ctx.fillText(tag, 0, 13);
  }

  ctx.restore();
}

function drawRoomFlooringHatch(
  ctx: CanvasRenderingContext2D,
  room: Room,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number
) {
  const mat = DEFAULT_MATERIALS.find((m) => m.id === room.floorMaterialId) || DEFAULT_MATERIALS[0];
  const config = room.flooringConfig;
  const cat = mat?.category;

  if (cat === 'tile') {
    const tileInches = config?.tileSizeInches || 24;
    const step = tileInches * 16;
    if (step * zoom < 4) return;
    const grout = config?.groutColor || 'grey';
    ctx.strokeStyle =
      grout === 'charcoal'
        ? 'rgba(30, 41, 59, 0.4)'
        : grout === 'light'
        ? 'rgba(255, 255, 255, 0.45)'
        : 'rgba(100, 116, 139, 0.28)';
    ctx.lineWidth = 1;

    const startX = Math.floor(minX / step) * step;
    const startY = Math.floor(minY / step) * step;

    if (config?.jointPattern === 'herringbone') {
      const diagSpan = (maxY - minY) + (maxX - minX);
      for (let offset = -diagSpan; offset <= diagSpan; offset += step) {
        const p1 = worldToScreen(minX + offset, minY);
        const p2 = worldToScreen(minX + offset + (maxY - minY), maxY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    } else {
      for (let x = startX; x <= maxX; x += step) {
        const p1 = worldToScreen(x, minY);
        const p2 = worldToScreen(x, maxY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      let row = 0;
      for (let y = startY; y <= maxY; y += step) {
        const p1 = worldToScreen(minX, y);
        const p2 = worldToScreen(maxX, y);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (config?.jointPattern === 'staggered' && row % 2 === 1) {
          // Half offset line joints
          for (let x = startX + step / 2; x <= maxX; x += step) {
            const jp1 = worldToScreen(x, y);
            const jp2 = worldToScreen(x, Math.min(maxY, y + step));
            ctx.beginPath();
            ctx.moveTo(jp1.x, jp1.y);
            ctx.lineTo(jp2.x, jp2.y);
            ctx.stroke();
          }
        }
        row++;
      }
    }
  } else if (cat === 'pvc' || cat === 'wood') {
    const plankWidth = 8 * 16; // 8 inches wide
    const plankLength = 48 * 16; // 48 inches long
    if (plankWidth * zoom >= 4) {
      ctx.strokeStyle = 'rgba(120, 85, 45, 0.25)';
      ctx.lineWidth = 1;
      const startY = Math.floor(minY / plankWidth) * plankWidth;
      let rowIndex = 0;
      for (let y = startY; y <= maxY; y += plankWidth) {
        const p1 = worldToScreen(minX, y);
        const p2 = worldToScreen(maxX, y);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Staggered plank butt joints
        const offsetX = (rowIndex % 3) * (plankLength / 3);
        const startX = Math.floor((minX - offsetX) / plankLength) * plankLength + offsetX;
        for (let x = startX; x <= maxX; x += plankLength) {
          const jp1 = worldToScreen(x, y);
          const jp2 = worldToScreen(x, y + plankWidth);
          ctx.beginPath();
          ctx.moveTo(jp1.x, jp1.y);
          ctx.lineTo(jp2.x, jp2.y);
          ctx.stroke();
        }
        rowIndex++;
      }
    }
  } else if (cat === 'marble') {
    // Elegant large-format slabs (36" x 36") with subtle hairline seams
    const slabStep = 36 * 16;
    if (slabStep * zoom >= 6) {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.18)';
      ctx.lineWidth = 1;
      const startX = Math.floor(minX / slabStep) * slabStep;
      const startY = Math.floor(minY / slabStep) * slabStep;
      for (let x = startX; x <= maxX; x += slabStep) {
        const p1 = worldToScreen(x, minY);
        const p2 = worldToScreen(x, maxY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      for (let y = startY; y <= maxY; y += slabStep) {
        const p1 = worldToScreen(minX, y);
        const p2 = worldToScreen(maxX, y);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  } else if (cat === 'concrete') {
    // Clean matte concrete micro-stipple hatching
    if (zoom >= 0.4) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 0.75;
      const stippleStep = 24 * 16;
      const startX = Math.floor(minX / stippleStep) * stippleStep;
      for (let x = startX; x <= maxX; x += stippleStep) {
        const p1 = worldToScreen(x, minY);
        const p2 = worldToScreen(x + (maxY - minY), maxY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }
}

function drawSitePlan(
  ctx: CanvasRenderingContext2D,
  site: SitePlan,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number,
  selectedFeatureId: string | null
) {
  const lotPoly = computeLotPolygon(site);
  if (lotPoly.length >= 3) {
    // 1. Property Lot Boundary (Cadastral Survey Line)
    ctx.save();
    ctx.beginPath();
    const p0 = worldToScreen(lotPoly[0].x, lotPoly[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < lotPoly.length; i++) {
      const pt = worldToScreen(lotPoly[i].x, lotPoly[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();

    // Soft lawn grass tint outside building footprint
    ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
    ctx.fill();

    // Cadastral Dash-Dot Boundary line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = Math.max(1.5, 2 * zoom);
    ctx.setLineDash([12, 4, 3, 4]); // Dash-dot standard property line
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner Survey Markers
    for (const p of lotPoly) {
      const sp = worldToScreen(p.x, p.y);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Property Boundary Dimensions and Label
    if (zoom >= 0.25) {
      const topMid = worldToScreen(0, -site.lotDepth / 2);
      const bottomMid = worldToScreen(0, site.lotDepth / 2);
      const leftMid = worldToScreen(-site.lotWidth / 2, 0);
      const rightMid = worldToScreen(site.lotWidth / 2, 0);

      ctx.font = '700 11px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `PROPERTY LINE — ${formatFeetInches(site.lotWidth)} (FRONT)`,
        bottomMid.x,
        bottomMid.y - 6
      );

      ctx.textBaseline = 'top';
      ctx.fillText(
        `PROPERTY LINE — ${formatFeetInches(site.lotWidth)} (REAR)`,
        topMid.x,
        topMid.y + 6
      );

      ctx.save();
      ctx.translate(leftMid.x + 8, leftMid.y);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${formatFeetInches(site.lotDepth)} LOT DEPTH`, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(rightMid.x - 8, rightMid.y);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`${formatFeetInches(site.lotDepth)} LOT DEPTH`, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // 2. Setback Envelope Line (Amber Dashed)
  const setbackPoly = computeSetbackPolygon(site);
  if (setbackPoly.length >= 3) {
    ctx.save();
    ctx.beginPath();
    const sp0 = worldToScreen(setbackPoly[0].x, setbackPoly[0].y);
    ctx.moveTo(sp0.x, sp0.y);
    for (let i = 1; i < setbackPoly.length; i++) {
      const spt = worldToScreen(setbackPoly[i].x, setbackPoly[i].y);
      ctx.lineTo(spt.x, spt.y);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)'; // Amber 600
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (zoom >= 0.45) {
      const setbackFront = worldToScreen(0, setbackPoly[0].y);
      ctx.font = '600 10px sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `BUILDABLE ENVELOPE (${formatFeetInches(site.frontSetback)} FRONT SETBACK)`,
        setbackFront.x,
        setbackFront.y - 4
      );
    }
    ctx.restore();
  }

  // 3. Render Outdoor Features (Pool, Patio, Deck, Driveway, Trees, Fences)
  for (const feat of site.features) {
    drawOutdoorFeature(ctx, feat, worldToScreen, zoom, feat.id === selectedFeatureId);
  }
}

function drawOutdoorFeature(
  ctx: CanvasRenderingContext2D,
  feat: OutdoorFeature,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number,
  isSelected: boolean
) {
  const center = worldToScreen(feat.position.x, feat.position.y);
  const pxPerSixteenth = (48 * zoom) / SIXTEENTHS_PER_FOOT;
  const w = feat.width * pxPerSixteenth;
  const d = feat.depth * pxPerSixteenth;

  ctx.save();
  ctx.translate(center.x, center.y);
  if (feat.rotation) {
    ctx.rotate((feat.rotation * Math.PI) / 180);
  }

  switch (feat.type) {
    case 'pool': {
      const coping = (feat.metadata?.copingWidthInches || 12) * 16 * pxPerSixteenth;
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-w / 2 - coping, -d / 2 - coping, w + coping * 2, d + coping * 2, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(14, 165, 233, 0.65)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -d / 2, w, d, 6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, (w / 3) * (r / 3), (d / 3) * (r / 3), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (zoom >= 0.4) {
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feat.name, 0, 0);
        ctx.font = '600 9px sans-serif';
        ctx.fillText(`3′ SHALLOW`, 0, -d / 2 + 16);
        ctx.fillText(`6′ DEEP`, 0, d / 2 - 16);
      }
      break;
    }

    case 'deck': {
      ctx.fillStyle = 'rgba(180, 83, 9, 0.22)';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-w / 2, -d / 2, w, d);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
      ctx.lineWidth = 1;
      const plankStep = Math.max(4, 6 * 16 * pxPerSixteenth);
      for (let y = -d / 2 + plankStep; y < d / 2; y += plankStep) {
        ctx.beginPath();
        ctx.moveTo(-w / 2, y);
        ctx.lineTo(w / 2, y);
        ctx.stroke();
      }

      if (zoom >= 0.4) {
        ctx.font = '700 10.5px sans-serif';
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feat.name, 0, 0);
      }
      break;
    }

    case 'patio': {
      ctx.fillStyle = 'rgba(214, 211, 209, 0.35)';
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-w / 2, -d / 2, w, d);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(120, 113, 108, 0.3)';
      ctx.lineWidth = 1;
      const paverStep = Math.max(6, 18 * 16 * pxPerSixteenth);
      for (let x = -w / 2 + paverStep; x < w / 2; x += paverStep) {
        ctx.beginPath();
        ctx.moveTo(x, -d / 2);
        ctx.lineTo(x, d / 2);
        ctx.stroke();
      }
      for (let y = -d / 2 + paverStep; y < d / 2; y += paverStep) {
        ctx.beginPath();
        ctx.moveTo(-w / 2, y);
        ctx.lineTo(w / 2, y);
        ctx.stroke();
      }

      if (zoom >= 0.4) {
        ctx.font = '700 10.5px sans-serif';
        ctx.fillStyle = '#44403c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feat.name, 0, 0);
      }
      break;
    }

    case 'driveway': {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -d / 2, w, d, 4);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
      ctx.lineWidth = 1;
      const diagStep = Math.max(8, 24 * 16 * pxPerSixteenth);
      for (let offset = -d - w; offset < d + w; offset += diagStep) {
        ctx.beginPath();
        ctx.moveTo(Math.max(-w / 2, offset), -d / 2);
        ctx.lineTo(Math.min(w / 2, offset + d), d / 2);
        ctx.stroke();
      }

      if (zoom >= 0.4) {
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feat.name, 0, 0);
      }
      break;
    }

    case 'pathway': {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -d / 2, w, d, 8);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'fence': {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = Math.max(2, 4 * zoom);
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();

      const postCount = Math.max(2, Math.round(feat.width / (8 * SIXTEENTHS_PER_FOOT)));
      for (let i = 0; i <= postCount; i++) {
        const px = -w / 2 + (w / postCount) * i;
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(px, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'tree': {
      const radius = Math.max(w, d) / 2;
      const isPalm = feat.metadata?.treeType === 'palm';
      const isPine = feat.metadata?.treeType === 'pine';

      ctx.fillStyle = isPalm
        ? 'rgba(22, 101, 52, 0.32)'
        : isPine
        ? 'rgba(20, 83, 45, 0.35)'
        : 'rgba(21, 128, 61, 0.3)';
      ctx.strokeStyle = isPalm ? '#15803d' : '#14532d';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const rays = isPalm ? 8 : 6;
      ctx.strokeStyle = isPalm ? '#166534' : '#15803d';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius * 0.85, Math.sin(angle) * radius * 0.85);
        ctx.stroke();
      }

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(3, radius * 0.15), 0, Math.PI * 2);
      ctx.fill();

      if (zoom >= 0.5) {
        ctx.font = '700 9.5px sans-serif';
        ctx.fillStyle = '#064e3b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(feat.name, 0, radius + 4);
      }
      break;
    }

    case 'shrub':
    case 'garden_bed': {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.38)';
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -d / 2, w, d, 10);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  if (isSelected) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    const margin = 4;
    ctx.strokeRect(-w / 2 - margin, -d / 2 - margin, w + margin * 2, d + margin * 2);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/**
 * Renders 2D CAD linework for modular kitchen designs (countertop, cabinets, sink, hob).
 */
function drawKitchenDesign(
  ctx: CanvasRenderingContext2D,
  kitchen: KitchenDesign,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number
) {
  ctx.save();
  const origin = worldToScreen(kitchen.position.x, kitchen.position.y);
  ctx.translate(origin.x, origin.y);
  ctx.rotate((kitchen.rotation * Math.PI) / 180);

  for (const cab of kitchen.cabinets) {
    const isBase = cab.type.startsWith('base') || cab.type === 'island_base';
    const cx = cab.position.x * zoom;
    const cy = cab.position.y * zoom;
    const cw = cab.width * zoom;
    const cd = cab.depth * zoom;

    ctx.save();
    ctx.translate(cx, cy);
    if (cab.rotation) {
      ctx.rotate((cab.rotation * Math.PI) / 180);
    }

    if (isBase) {
      // Solid Countertop Fill & Outline
      ctx.fillStyle = cab.type === 'island_base' ? 'rgba(249, 115, 22, 0.08)' : 'rgba(51, 65, 85, 0.08)';
      ctx.fillRect(-cw / 2, -cd / 2, cw, cd);

      ctx.strokeStyle = cab.type === 'island_base' ? '#ea580c' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(-cw / 2, -cd / 2, cw, cd);

      // Subdued front door/drawer divide line
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-cw / 2, -cd / 2 + 4 * zoom);
      ctx.lineTo(cw / 2, -cd / 2 + 4 * zoom);
      ctx.stroke();
    } else {
      // Overhead Wall Cabinet: Architectural Standard Dashed Line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-cw / 2, -cd / 2, cw, cd);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // Draw Built-in Appliances
  for (const app of kitchen.appliances) {
    const ax = app.position.x * zoom;
    const ay = app.position.y * zoom;
    const aw = app.width * zoom;
    const ad = app.depth * zoom;

    ctx.save();
    ctx.translate(ax, ay);
    if (app.rotation) {
      ctx.rotate((app.rotation * Math.PI) / 180);
    }

    if (app.type.includes('sink')) {
      // Sink Basin
      ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
      ctx.fillRect(-aw / 2, -ad / 2, aw, ad);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(-aw / 2, -ad / 2, aw, ad);

      // Inner bowl
      const bowlMargin = 4 * zoom;
      ctx.strokeRect(-aw / 2 + bowlMargin, -ad / 2 + bowlMargin, aw - bowlMargin * 2, ad - bowlMargin * 2);

      // Drain hole
      ctx.beginPath();
      ctx.arc(0, 0, 3 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    } else if (app.type.includes('hob')) {
      // Cooktop Hob
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(-aw / 2, -ad / 2, aw, ad);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(-aw / 2, -ad / 2, aw, ad);

      // 4 Burner rings
      const bRad = Math.min(aw, ad) * 0.16;
      const bOffX = aw * 0.24;
      const bOffY = ad * 0.22;
      const burners = [
        { x: -bOffX, y: -bOffY },
        { x: bOffX, y: -bOffY },
        { x: -bOffX, y: bOffY },
        { x: bOffX, y: bOffY },
      ];
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      for (const b of burners) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, bRad, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders 2D CAD Vastu Purusha Mandala 9-Sector Grid overlay.
 */
function drawVastuPurushaGrid(
  ctx: CanvasRenderingContext2D,
  project: Project,
  floor: Floor,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number
) {
  const bbox = computeFloorBoundingBox(floor);
  if (bbox.width <= 0 || bbox.height <= 0) return;

  ctx.save();

  const northDegrees = project.site?.northOrientationDegrees || 0;
  const rad = (northDegrees * Math.PI) / 180;

  const colW = bbox.width / 3;
  const rowH = bbox.height / 3;

  const sectorLabels = [
    ['NW (Vayu)', 'N (Kubera)', 'NE (Ishanya)'],
    ['W (Varuna)', 'Brahmasthan', 'E (Indra)'],
    ['SW (Nairutya)', 'S (Yama)', 'SE (Agni)'],
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const minX = bbox.minX + c * colW;
      const minY = bbox.minY + r * rowH;
      const maxX = minX + colW;
      const maxY = minY + rowH;
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const p1 = worldToScreen(minX, minY);
      const p2 = worldToScreen(maxX, minY);
      const p3 = worldToScreen(maxX, maxY);
      const p4 = worldToScreen(minX, maxY);
      const pMid = worldToScreen(midX, midY);

      const isCenter = r === 1 && c === 1;

      // Draw sector boundary
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      if (isCenter) {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.06)';
        ctx.fill();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.8;
      } else {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.02)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
        ctx.lineWidth = 1;
      }
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      // Draw Sector Label
      ctx.save();
      ctx.translate(pMid.x, pMid.y);
      ctx.fillStyle = isCenter ? '#ec4899' : '#0284c7';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sectorLabels[r][c], 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

interface PlanEditor2DProps {
  project: Project;
  activeTool: CADTool;
  selectedWallId: string | null;
  selectedOpeningId?: string | null;
  selectedRoomId?: string | null;
  selectedStairId?: string | null;
  selectedColumnId?: string | null;
  selectedFurnitureId?: string | null;
  selectedSymbolId?: string | null;
  selectedSectionId?: string | null;
  selectedOutdoorFeatureId?: string | null;
  onSelectWall: (wallId: string | null) => void;
  onSelectRoom?: (roomId: string | null) => void;
  onOpenFlooringStudio?: (roomId?: string) => void;
  onOpenSiteModal?: () => void;
  onSelectOpening?: (openingId: string | null, wallId: string | null) => void;
  onSelectStair?: (stairId: string | null) => void;
  onSelectColumn?: (columnId: string | null) => void;
  onSelectFurniture?: (furnitureId: string | null) => void;
  onSelectSymbol?: (symbolId: string | null) => void;
  onSelectSection?: (sectionId: string | null) => void;
  onSelectOutdoorFeature?: (featureId: string | null) => void;
  onAddWall: (start: Point2D, end: Point2D, thickness: Sixteenths) => void;
  onUpdateWall: (wall: Wall) => void;
  onUpdateWallBatch?: (updatedWalls: Wall[]) => void;
  onAddOpening: (wallId: string, opening: WallOpening) => void;
  onUpdateOpening?: (wallId: string, opening: WallOpening) => void;
  onAddStaircase?: (staircase: Staircase) => void;
  onUpdateStaircase?: (staircase: Staircase) => void;
  onAddColumn?: (column: Column) => void;
  onUpdateColumn?: (column: Column) => void;
  onAddFurniture?: (furniture: FurnitureInstance) => void;
  onUpdateFurniture?: (furniture: FurnitureInstance) => void;
  onAddSymbol?: (symbol: ArchitecturalSymbol) => void;
  onUpdateSymbol?: (symbol: ArchitecturalSymbol) => void;
  onUpdateSectionCut?: (cut: SectionCut) => void;
  activeFurnitureCatalogId?: string | null;
  onOpenFurnitureCatalog?: () => void;
  activeSymbolType?: SymbolType;
  onSymbolTypeChange?: (type: SymbolType) => void;
  onOpenRoofConfig?: () => void;
  activeThickness: Sixteenths;
  snapGrid: Sixteenths;
  orthogonalSnap: boolean;
  onCursorMove: (coords: Point2D | null) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isCalibrating?: boolean;
  onCalibrationPointsPicked?: (p1: Point2D, p2: Point2D, pixelDistance: number) => void;
  walkCameraState?: { x: Sixteenths; y: Sixteenths; yaw: number } | null;
}

export const PlanEditor2D: React.FC<PlanEditor2DProps> = ({
  project,
  activeTool,
  selectedWallId,
  selectedOpeningId,
  selectedRoomId,
  selectedStairId,
  selectedColumnId,
  selectedFurnitureId,
  selectedSymbolId,
  selectedSectionId,
  selectedOutdoorFeatureId,
  onSelectWall,
  onSelectRoom,
  onOpenFlooringStudio,
  onOpenSiteModal,
  onSelectOpening,
  onSelectStair,
  onSelectColumn,
  onSelectFurniture,
  onSelectSymbol,
  onSelectSection,
  onSelectOutdoorFeature,
  onAddWall,
  onUpdateWall,
  onUpdateWallBatch,
  onAddOpening,
  onUpdateOpening,
  onAddStaircase,
  onUpdateStaircase,
  onAddColumn,
  onUpdateColumn,
  onAddFurniture,
  onUpdateFurniture,
  onAddSymbol,
  onUpdateSymbol,
  onUpdateSectionCut,
  activeFurnitureCatalogId,
  onOpenFurnitureCatalog,
  activeSymbolType,
  onSymbolTypeChange,
  onOpenRoofConfig,
  activeThickness,
  snapGrid,
  orthogonalSnap,
  onCursorMove,
  zoom,
  onZoomChange,
  isCalibrating,
  onCalibrationPointsPicked,
  walkCameraState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rulerTopRef = useRef<HTMLCanvasElement>(null);
  const rulerLeftRef = useRef<HTMLCanvasElement>(null);

  // Pan offset in screen pixels from center
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentCursorPoint, setCurrentCursorPoint] = useState<Point2D | null>(null);

  // Wall drawing in progress
  const [wallStartPoint, setWallStartPoint] = useState<Point2D | null>(null);
  const [activeGuidelines, setActiveGuidelines] = useState<AlignmentGuide[]>([]);

  // Door/Window Hover Placement state
  const [hoverOpeningWall, setHoverOpeningWall] = useState<{
    wall: Wall;
    offset: Sixteenths;
    projPoint: Point2D;
  } | null>(null);
  const [flipInward, setFlipInward] = useState(true);
  const [flipHand, setFlipHand] = useState(true);

  // Dragging state for selected wall, junction corner, column, stair, furniture, symbol, or section cut
  const [dragMode, setDragMode] = useState<
    'none' | 'junction' | 'wall' | 'opening' | 'column' | 'stair' | 'furniture' | 'rotate' | 'symbol' | 'section_p1' | 'section_p2' | 'section_body'
  >('none');
  const [dragSectionCutId, setDragSectionCutId] = useState<string | null>(null);
  const [dragSectionStart, setDragSectionStart] = useState<{ p1: Point2D; p2: Point2D } | null>(null);
  const [dragJunctionOrigin, setDragJunctionOrigin] = useState<Point2D | null>(null);
  const [dragItemStartPos, setDragItemStartPos] = useState<Point2D | null>(null);
  const [dragConnectedWalls, setDragConnectedWalls] = useState<
    { wall: Wall; isStart: boolean; origStart: Point2D; origEnd: Point2D }[]
  >([]);
  const [dragMouseOrigin, setDragMouseOrigin] = useState<Point2D | null>(null);
  const [dragWallStartPos, setDragWallStartPos] = useState<{ start: Point2D; end: Point2D } | null>(null);
  const [dragRotateOrigin, setDragRotateOrigin] = useState<Point2D | null>(null);
  const [dragRotateItemType, setDragRotateItemType] = useState<'furniture' | 'column' | 'stair' | 'wall' | 'symbol' | null>(null);
  const [placementRotation, setPlacementRotation] = useState<number>(0);

  const [calibPoint1, setCalibPoint1] = useState<Point2D | null>(null);
  const refPlanImageRef = useRef<HTMLImageElement | null>(null);
  const [, setRefPlanLoaded] = useState(false);

  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];

  useEffect(() => {
    const refPlan = activeFloor.referencePlan;
    if (refPlan?.imageUrl) {
      const img = new Image();
      img.onload = () => {
        refPlanImageRef.current = img;
        setRefPlanLoaded((v) => !v);
      };
      img.src = refPlan.imageUrl;
    } else {
      refPlanImageRef.current = null;
      setRefPlanLoaded(false);
    }
  }, [activeFloor.referencePlan?.imageUrl]);

  useEffect(() => {
    if (!isCalibrating) {
      setCalibPoint1(null);
    }
  }, [isCalibrating]);

  // Screen <-> World coordinate transforms
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point2D => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const pxPerSixteenth = (48 * zoom) / SIXTEENTHS_PER_FOOT;

      return {
        x: Math.round((screenX - centerX) / pxPerSixteenth),
        y: Math.round((centerY - screenY) / pxPerSixteenth),
      };
    },
    [pan, zoom]
  );

  const worldToScreen = useCallback(
    (worldX: Sixteenths, worldY: Sixteenths): { x: number; y: number } => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const pxPerSixteenth = (48 * zoom) / SIXTEENTHS_PER_FOOT;

      return {
        x: centerX + worldX * pxPerSixteenth,
        y: centerY - worldY * pxPerSixteenth,
      };
    },
    [pan, zoom]
  );

  // Keyboard shortcut for flipping door/window and rotating elements (R/Shift+R)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'f' || e.code === 'Space') {
        if (activeTool === 'door' || activeTool === 'window') {
          e.preventDefault();
          setFlipInward((prev) => !prev);
        }
      }

      if (activeTool === 'mep' && e.key >= '1' && e.key <= '9') {
        const cat = MEP_CATALOG.find((it) => it.hotkey === e.key);
        if (cat && onSymbolTypeChange) {
          onSymbolTypeChange(cat.type);
        }
      }

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const step = e.shiftKey ? -Math.PI / 2 : Math.PI / 2;

        if (selectedSymbolId && onUpdateSymbol) {
          const sym = (activeFloor.symbols || []).find((it) => it.id === selectedSymbolId);
          if (sym) onUpdateSymbol({ ...sym, rotation: (sym.rotation + step) % (2 * Math.PI) });
        } else if (selectedFurnitureId && onUpdateFurniture) {
          const f = (activeFloor.furniture || []).find((it) => it.id === selectedFurnitureId);
          if (f) onUpdateFurniture({ ...f, rotation: (f.rotation + step) % (2 * Math.PI) });
        } else if (selectedColumnId && onUpdateColumn) {
          const c = (activeFloor.columns || []).find((it) => it.id === selectedColumnId);
          if (c) onUpdateColumn({ ...c, rotation: ((c.rotation || 0) + step) % (2 * Math.PI) });
        } else if (selectedStairId && onUpdateStaircase) {
          const s = (activeFloor.stairs || []).find((it) => it.id === selectedStairId);
          if (s) onUpdateStaircase({ ...s, angle: (s.angle + step) % (2 * Math.PI) });
        } else if (selectedWallId && onUpdateWall) {
          const w = activeFloor.walls.find((it) => it.id === selectedWallId);
          if (w) onUpdateWall(rotateWallAroundMidpoint(w, wallAngle(w) + step));
        } else {
          // In placement mode, rotate pre-placement preview
          setPlacementRotation((prev) => (prev + step) % (2 * Math.PI));
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    activeTool,
    selectedSymbolId,
    selectedFurnitureId,
    selectedColumnId,
    selectedStairId,
    selectedWallId,
    activeFloor,
    onUpdateSymbol,
    onSymbolTypeChange,
    onUpdateFurniture,
    onUpdateColumn,
    onUpdateStaircase,
    onUpdateWall,
  ]);

  // Main Canvas Render (White Background & Clean Light CAD Aesthetics)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Clean Pure White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const pxPerFoot = 48 * zoom;
    const pxPerSixteenth = pxPerFoot / SIXTEENTHS_PER_FOOT;
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;

    // Minor 1-Foot Grid Lines (Light Grey)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.045)';
    const startGridX = ((centerX % pxPerFoot) + pxPerFoot) % pxPerFoot;
    for (let x = startGridX; x < width; x += pxPerFoot) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const startGridY = ((centerY % pxPerFoot) + pxPerFoot) % pxPerFoot;
    for (let y = startGridY; y < height; y += pxPerFoot) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major 10-Foot Grid Lines (Crisp Medium Grey)
    const pxPer10Ft = pxPerFoot * 10;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    const startMajorX = ((centerX % pxPer10Ft) + pxPer10Ft) % pxPer10Ft;
    for (let x = startMajorX; x < width; x += pxPer10Ft) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const startMajorY = ((centerY % pxPer10Ft) + pxPer10Ft) % pxPer10Ft;
    for (let y = startMajorY; y < height; y += pxPer10Ft) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Origin Crosshair (0, 0) in soft blue
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 16, centerY);
    ctx.lineTo(centerX + 16, centerY);
    ctx.moveTo(centerX, centerY - 16);
    ctx.lineTo(centerX, centerY + 16);
    ctx.stroke();

    // Render Reference Plan Image Layer (if present and visible)
    const refPlan = activeFloor.referencePlan;
    if (refPlan && refPlan.isVisible !== false && refPlanImageRef.current) {
      const img = refPlanImageRef.current;
      const topLeftScreen = worldToScreen(refPlan.x, refPlan.y);
      const sWidth = refPlan.width * pxPerSixteenth;
      const sHeight = refPlan.height * pxPerSixteenth;

      ctx.save();
      ctx.globalAlpha = refPlan.opacity ?? 0.6;
      ctx.drawImage(img, topLeftScreen.x, topLeftScreen.y, sWidth, sHeight);
      ctx.restore();

      // If in calibration mode or uncalibrated, render bounding guide border
      if (isCalibrating || !refPlan.isCalibrated) {
        ctx.save();
        ctx.strokeStyle = isCalibrating ? '#3b82f6' : '#eab308';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(topLeftScreen.x, topLeftScreen.y, sWidth, sHeight);
        ctx.restore();
      }
    }

    // Render Site Plan (Lot Survey Boundary, Setback Envelope, Outdoor Living Features)
    if (project.site && project.settings.showSitePlan !== false) {
      drawSitePlan(
        ctx,
        project.site,
        worldToScreen,
        zoom,
        selectedOutdoorFeatureId ?? null
      );
    }

    // Render Vastu Shastra 9-Grid Overlay if enabled
    if (project.settings.showVastuGrid) {
      drawVastuPurushaGrid(ctx, project, activeFloor, worldToScreen, pxPerSixteenth);
    }

    // Render Rooms (Warm Floor Slab Tint & Labels)
    for (const room of activeFloor.rooms) {
      if (room.polygon.length >= 3) {
        const isSelected = room.id === selectedRoomId;

        // Room Dimensions bounds
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of room.polygon) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }

        ctx.beginPath();
        const p0 = worldToScreen(room.polygon[0].x, room.polygon[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < room.polygon.length; i++) {
          const pt = worldToScreen(room.polygon[i].x, room.polygon[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        // Material-aware base color tint
        const roomMat = DEFAULT_MATERIALS.find((m) => m.id === room.floorMaterialId);
        let baseColor = isSelected ? 'rgba(59, 130, 246, 0.18)' : 'rgba(217, 119, 6, 0.08)';
        if (!isSelected && roomMat?.color) {
          const hex = roomMat.color.replace('#', '');
          const cr = parseInt(hex.substring(0, 2), 16) || 200;
          const cg = parseInt(hex.substring(2, 4), 16) || 200;
          const cb = parseInt(hex.substring(4, 6), 16) || 200;
          baseColor = `rgba(${cr}, ${cg}, ${cb}, 0.18)`;
        }

        ctx.fillStyle = baseColor;
        ctx.fill();

        // Render CAD Architectural Floor Hatching clipped within the room boundary
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < room.polygon.length; i++) {
          const pt = worldToScreen(room.polygon[i].x, room.polygon[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.clip();
        drawRoomFlooringHatch(ctx, room, minX, maxX, minY, maxY, worldToScreen, zoom);
        ctx.restore();

        if (isSelected) {
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const roomW = Math.round(maxX - minX);
        const roomD = Math.round(maxY - minY);
        const dimStr = `${formatFeetInches(roomW)} × ${formatFeetInches(roomD)}`;

        // Room Name and Square Footage Badge
        const center = room.polygon.reduce(
          (acc, p) => ({ x: acc.x + p.x / room.polygon.length, y: acc.y + p.y / room.polygon.length }),
          { x: 0, y: 0 }
        );
        const sc = worldToScreen(Math.round(center.x), Math.round(center.y));

        ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
        const nameTm = ctx.measureText(room.name);
        const dimTm = ctx.measureText(dimStr);
        const maxTextW = Math.max(nameTm.width, dimTm.width);
        const areaStr = room.computedAreaSqFt ? `${room.computedAreaSqFt} sq ft` : '';

        // Badge background
        const badgeW = Math.max(90, maxTextW + 28);
        const badgeH = 54;
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = isSelected ? 'rgba(37, 99, 235, 0.25)' : 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = isSelected ? 12 : 6;
        ctx.beginPath();
        ctx.roundRect(sc.x - badgeW / 2, sc.y - badgeH / 2, badgeW, badgeH, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isSelected ? '#2563eb' : '#e5e7eb';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Room Name
        ctx.fillStyle = isSelected ? '#1d4ed8' : '#111827';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(room.name, sc.x, sc.y - 14);

        // Dimensions
        ctx.font = '600 10px monospace';
        ctx.fillStyle = '#4b5563';
        ctx.fillText(dimStr, sc.x, sc.y);

        // Area badge
        if (areaStr) {
          ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillStyle = '#059669';
          ctx.fillText(areaStr, sc.x, sc.y + 14);
        }
      }
    }

    // ═══════ EXTERIOR DIMENSION CHAINS ═══════
    if (project.settings.showDimensions !== false && activeFloor.walls.length > 0) {
      // Collect all wall endpoints to compute overall bounding box
      let minWX = Infinity, minWY = Infinity, maxWX = -Infinity, maxWY = -Infinity;
      for (const w of activeFloor.walls) {
        minWX = Math.min(minWX, w.start.x, w.end.x);
        minWY = Math.min(minWY, w.start.y, w.end.y);
        maxWX = Math.max(maxWX, w.start.x, w.end.x);
        maxWY = Math.max(maxWY, w.start.y, w.end.y);
      }

      const dimOffset = 56; // pixels offset from extremity
      const dimTickLen = 10;
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.fillStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.font = '600 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Helper: draw a single horizontal dim chain between two world-X values at a screen-Y offset
      const drawHorizDim = (wx1: number, wx2: number, sy: number) => {
        if (wx2 <= wx1) return;
        const s1 = worldToScreen(wx1, 0);
        const s2 = worldToScreen(wx2, 0);
        const dimText = formatFeetInches(wx2 - wx1);
        // Extension ticks
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(s1.x, sy - dimTickLen); ctx.lineTo(s1.x, sy + dimTickLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s2.x, sy - dimTickLen); ctx.lineTo(s2.x, sy + dimTickLen); ctx.stroke();
        // Dim line
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(s1.x, sy); ctx.lineTo(s2.x, sy); ctx.stroke();
        // Arrowheads
        ctx.beginPath(); ctx.moveTo(s1.x, sy); ctx.lineTo(s1.x + 7, sy - 3); ctx.lineTo(s1.x + 7, sy + 3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s2.x, sy); ctx.lineTo(s2.x - 7, sy - 3); ctx.lineTo(s2.x - 7, sy + 3); ctx.closePath(); ctx.fill();
        // Label
        const midX = (s1.x + s2.x) / 2;
        ctx.fillStyle = 'white';
        const tm = ctx.measureText(dimText);
        ctx.fillRect(midX - tm.width / 2 - 3, sy - 7, tm.width + 6, 14);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillText(dimText, midX, sy);
      };

      const drawVertDim = (wy1: number, wy2: number, sx: number) => {
        if (wy2 <= wy1) return;
        const s1 = worldToScreen(0, wy1);
        const s2 = worldToScreen(0, wy2);
        const dimText = formatFeetInches(wy2 - wy1);
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(sx - dimTickLen, s1.y); ctx.lineTo(sx + dimTickLen, s1.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx - dimTickLen, s2.y); ctx.lineTo(sx + dimTickLen, s2.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(sx, s1.y); ctx.lineTo(sx, s2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, s1.y); ctx.lineTo(sx - 3, s1.y + 7); ctx.lineTo(sx + 3, s1.y + 7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx, s2.y); ctx.lineTo(sx - 3, s2.y - 7); ctx.lineTo(sx + 3, s2.y - 7); ctx.closePath(); ctx.fill();
        ctx.save();
        const midY = (s1.y + s2.y) / 2;
        ctx.translate(sx, midY);
        ctx.rotate(-Math.PI / 2);
        const tm = ctx.measureText(dimText);
        ctx.fillStyle = 'white';
        ctx.fillRect(-tm.width / 2 - 3, -7, tm.width + 6, 14);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillText(dimText, 0, 0);
        ctx.restore();
      };

      // Overall width (bottom)
      const botSy = worldToScreen(0, maxWY).y + dimOffset;
      drawHorizDim(minWX, maxWX, botSy);

      // Overall height (right)
      const rightSx = worldToScreen(maxWX, 0).x + dimOffset;
      drawVertDim(minWY, maxWY, rightSx);

      ctx.restore();
    }

    // ═══════ NORTH ARROW COMPASS ═══════
    {
      const nax = width - 48;
      const nay = height - 56;
      const nr = 22;
      ctx.save();
      // Circle background
      ctx.beginPath();
      ctx.arc(nax, nay, nr + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
      // North arrow (pointing up)
      ctx.beginPath();
      ctx.moveTo(nax, nay - nr);
      ctx.lineTo(nax - 8, nay + 4);
      ctx.lineTo(nax, nay - 2);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      // South half
      ctx.beginPath();
      ctx.moveTo(nax, nay - nr);
      ctx.lineTo(nax + 8, nay + 4);
      ctx.lineTo(nax, nay - 2);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      // South arrow
      ctx.beginPath();
      ctx.moveTo(nax, nay + nr);
      ctx.lineTo(nax - 6, nay - 2);
      ctx.lineTo(nax, nay + 4);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(nax, nay + nr);
      ctx.lineTo(nax + 6, nay - 2);
      ctx.lineTo(nax, nay + 4);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      // N label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('N', nax, nay - nr - 2);
      // Center dot
      ctx.beginPath();
      ctx.arc(nax, nay, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.restore();
    }

    // 0. Render Underlay / Ghost Walls from Floor Below (if enabled)
    if (project.settings.showUnderlay !== false) {
      const lowerFloor = project.floors.find((f) => f.levelIndex === activeFloor.levelIndex - 1);
      if (lowerFloor && lowerFloor.walls.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);

        for (const lw of lowerFloor.walls) {
          const lp1 = worldToScreen(lw.start.x, lw.start.y);
          const lp2 = worldToScreen(lw.end.x, lw.end.y);
          const lth = Math.max(2, lw.thickness * pxPerSixteenth);
          const langle = wallAngle(lw);
          const lperpX = -Math.sin(langle) * (lth / 2);
          const lperpY = -Math.cos(langle) * (lth / 2);

          ctx.beginPath();
          ctx.moveTo(lp1.x + lperpX, lp1.y + lperpY);
          ctx.lineTo(lp2.x + lperpX, lp2.y + lperpY);
          ctx.lineTo(lp2.x - lperpX, lp2.y - lperpY);
          ctx.lineTo(lp1.x - lperpX, lp1.y - lperpY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Underlay Indicator Badge
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`👻 Underlay: ${lowerFloor.name}`, 16, 16);
        ctx.restore();
      }
    }

    // Render Staircases
    for (const stair of activeFloor.stairs || []) {
      const isStairSelected = stair.id === selectedStairId;
      const fp = getStaircaseFootprint(stair);
      const treadLines = getStairTreadLines(stair);

      ctx.save();
      // Footprint background
      if (fp.length >= 3) {
        ctx.beginPath();
        const p0 = worldToScreen(fp[0].x, fp[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < fp.length; i++) {
          const pt = worldToScreen(fp[i].x, fp[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fillStyle = isStairSelected ? 'rgba(219, 234, 254, 0.7)' : '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = isStairSelected ? '#2563eb' : '#334155';
        ctx.lineWidth = isStairSelected ? 2.5 : 1.5;
        ctx.stroke();
      }

      // Tread lines
      ctx.strokeStyle = isStairSelected ? '#2563eb' : '#475569';
      ctx.lineWidth = 1.25;
      for (const tline of treadLines) {
        const tp1 = worldToScreen(tline.start.x, tline.start.y);
        const tp2 = worldToScreen(tline.end.x, tline.end.y);
        ctx.beginPath();
        ctx.moveTo(tp1.x, tp1.y);
        ctx.lineTo(tp2.x, tp2.y);
        ctx.stroke();
      }

      // Directional UP arrow
      const startSc = worldToScreen(stair.startPoint.x, stair.startPoint.y);
      const cosA = Math.cos(stair.angle);
      const sinA = Math.sin(stair.angle);
      const arrowLenPx = Math.min(100, Math.max(30, stair.riserCount * stair.treadDepth * pxPerSixteenth * 0.7));

      const arrowEndSc = {
        x: startSc.x + cosA * arrowLenPx,
        y: startSc.y - sinA * arrowLenPx,
      };

      ctx.strokeStyle = '#0284c7';
      ctx.fillStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startSc.x, startSc.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(startSc.x, startSc.y);
      ctx.lineTo(arrowEndSc.x, arrowEndSc.y);
      ctx.stroke();

      const headAngle = Math.atan2(arrowEndSc.y - startSc.y, arrowEndSc.x - startSc.x);
      ctx.beginPath();
      ctx.moveTo(arrowEndSc.x, arrowEndSc.y);
      ctx.lineTo(
        arrowEndSc.x - 9 * Math.cos(headAngle - Math.PI / 6),
        arrowEndSc.y - 9 * Math.sin(headAngle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowEndSc.x - 9 * Math.cos(headAngle + Math.PI / 6),
        arrowEndSc.y - 9 * Math.sin(headAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Text UP (X RISERS)
      ctx.font = '700 10px "SF Mono", Menlo, monospace';
      ctx.fillStyle = '#0369a1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `UP (${stair.riserCount} RISERS)`,
        (startSc.x + arrowEndSc.x) / 2,
        (startSc.y + arrowEndSc.y) / 2 - 4
      );

      ctx.restore();
    }

    // Render Structural Columns
    for (const col of activeFloor.columns || []) {
      const isColSelected = col.id === selectedColumnId;
      const cp = worldToScreen(col.position.x, col.position.y);
      const cw = col.width * pxPerSixteenth;
      const cd = col.depth * pxPerSixteenth;

      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(-(col.rotation || 0));

      if (col.shape === 'rectangular') {
        ctx.fillStyle = isColSelected ? '#bfdbfe' : '#ffffff';
        ctx.strokeStyle = isColSelected ? '#2563eb' : '#1e293b';
        ctx.lineWidth = isColSelected ? 2.5 : 1.5;
        ctx.fillRect(-cw / 2, -cd / 2, cw, cd);
        ctx.strokeRect(-cw / 2, -cd / 2, cw, cd);

        ctx.strokeStyle = isColSelected ? '#3b82f6' : '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-cw / 2, -cd / 2);
        ctx.lineTo(cw / 2, cd / 2);
        ctx.moveTo(cw / 2, -cd / 2);
        ctx.lineTo(-cw / 2, cd / 2);
        ctx.stroke();
      } else {
        const r = cw / 2;
        ctx.fillStyle = isColSelected ? '#bfdbfe' : '#ffffff';
        ctx.strokeStyle = isColSelected ? '#2563eb' : '#1e293b';
        ctx.lineWidth = isColSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = isColSelected ? '#3b82f6' : '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.moveTo(0, -r);
        ctx.lineTo(0, r);
        ctx.stroke();
      }

      if (isColSelected) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(-cw / 2 - 4, -cd / 2 - 4, cw + 8, cd + 8);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Render Furniture & Built-in Fixtures
    for (const furn of activeFloor.furniture || []) {
      const isFurnSelected = furn.id === selectedFurnitureId;
      const fp = worldToScreen(furn.position.x, furn.position.y);
      const fw = furn.dimensions.width * pxPerSixteenth;
      const fd = furn.dimensions.depth * pxPerSixteenth;

      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(-furn.rotation);

      // Base background fill & border
      const isParking = furn.catalogId === 'porch_car';
      const isGate = furn.catalogId === 'entry_gate';

      ctx.fillStyle = isFurnSelected
        ? 'rgba(191, 219, 254, 0.45)'
        : isParking
        ? 'rgba(241, 245, 249, 0.85)'
        : isGate
        ? 'rgba(255, 255, 255, 0.6)'
        : 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = isFurnSelected ? '#2563eb' : isParking ? '#64748b' : isGate ? '#0284c7' : '#475569';
      ctx.lineWidth = isFurnSelected ? 2 : isParking ? 1.5 : 1.2;

      if (isParking) {
        ctx.setLineDash([8, 6]);
      }
      ctx.fillRect(-fw / 2, -fd / 2, fw, fd);
      ctx.strokeRect(-fw / 2, -fd / 2, fw, fd);
      if (isParking) {
        ctx.setLineDash([]);
      }

      // Architectural symbol details
      if (furn.catalogId === 'wardrobe_built_in') {
        ctx.strokeStyle = isFurnSelected ? '#3b82f6' : '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-fw / 2, -fd / 2);
        ctx.lineTo(fw / 2, fd / 2);
        ctx.moveTo(-fw / 2, fd / 2);
        ctx.lineTo(fw / 2, -fd / 2);
        ctx.stroke();

        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#334155';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WARDROBE', 0, 0);
      } else if (furn.catalogId === 'bed_king' || furn.catalogId === 'bed_queen') {
        ctx.fillStyle = isFurnSelected ? '#93c5fd' : '#cbd5e1';
        ctx.fillRect(-fw / 2, -fd / 2, fw, Math.max(3, fd * 0.12));

        const pillowW = Math.max(6, (fw - 12) / 2);
        const pillowH = Math.max(6, fd * 0.22);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(-fw / 2 + 4, -fd / 2 + fd * 0.15, pillowW, pillowH);
        ctx.fillRect(-fw / 2 + 4, -fd / 2 + fd * 0.15, pillowW, pillowH);
        ctx.strokeRect(fw / 2 - 4 - pillowW, -fd / 2 + fd * 0.15, pillowW, pillowH);
        ctx.fillRect(fw / 2 - 4 - pillowW, -fd / 2 + fd * 0.15, pillowW, pillowH);

        ctx.beginPath();
        ctx.moveTo(-fw / 2, fd * 0.05);
        ctx.lineTo(fw / 2, fd * 0.05);
        ctx.stroke();

        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(furn.name.toUpperCase(), 0, fd * 0.28);
      } else if (furn.catalogId === 'sofa_3_seater' || furn.catalogId === 'sofa_armchair') {
        ctx.fillStyle = isFurnSelected ? '#93c5fd' : '#e2e8f0';
        ctx.fillRect(-fw / 2, -fd / 2, fw, fd * 0.25);
        ctx.fillRect(-fw / 2, -fd / 2, fw * 0.15, fd);
        ctx.fillRect(fw / 2 - fw * 0.15, -fd / 2, fw * 0.15, fd);

        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(furn.name.toUpperCase(), 0, fd * 0.15);
      } else if (furn.catalogId === 'dining_6_seater' || furn.catalogId === 'dining_4_seater') {
        // Table top
        const tw = fw * 0.68;
        const td = fd * 0.65;
        ctx.fillStyle = isFurnSelected ? '#bfdbfe' : '#f8fafc';
        ctx.fillRect(-tw / 2, -td / 2, tw, td);
        ctx.strokeRect(-tw / 2, -td / 2, tw, td);

        // Chairs around table
        ctx.fillStyle = isFurnSelected ? '#93c5fd' : '#f1f5f9';
        ctx.strokeStyle = isFurnSelected ? '#2563eb' : '#94a3b8';
        const chW = Math.max(6, tw * 0.32);
        const chD = Math.max(4, (fd - td) / 2.2);

        // Top chairs
        ctx.fillRect(-tw * 0.25 - chW / 2, -fd / 2 + 1, chW, chD);
        ctx.strokeRect(-tw * 0.25 - chW / 2, -fd / 2 + 1, chW, chD);
        ctx.fillRect(tw * 0.25 - chW / 2, -fd / 2 + 1, chW, chD);
        ctx.strokeRect(tw * 0.25 - chW / 2, -fd / 2 + 1, chW, chD);

        // Bottom chairs
        ctx.fillRect(-tw * 0.25 - chW / 2, fd / 2 - chD - 1, chW, chD);
        ctx.strokeRect(-tw * 0.25 - chW / 2, fd / 2 - chD - 1, chW, chD);
        ctx.fillRect(tw * 0.25 - chW / 2, fd / 2 - chD - 1, chW, chD);
        ctx.strokeRect(tw * 0.25 - chW / 2, fd / 2 - chD - 1, chW, chD);

        if (furn.catalogId === 'dining_6_seater') {
          // Left & Right end chairs
          const sideW = Math.max(4, (fw - tw) / 2.2);
          const sideH = Math.max(6, td * 0.4);
          ctx.fillRect(-fw / 2 + 1, -sideH / 2, sideW, sideH);
          ctx.strokeRect(-fw / 2 + 1, -sideH / 2, sideW, sideH);
          ctx.fillRect(fw / 2 - sideW - 1, -sideH / 2, sideW, sideH);
          ctx.strokeRect(fw / 2 - sideW - 1, -sideH / 2, sideW, sideH);
        }

        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#334155';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DINING', 0, 0);
      } else if (furn.catalogId === 'kitchen_counter_sink') {
        ctx.strokeRect(-fw * 0.38, -fd * 0.35, fw * 0.28, fd * 0.7);
        ctx.beginPath();
        ctx.arc(-fw * 0.24, 0, 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KITCHEN COUNTER', fw * 0.15, 0);
      } else if (furn.catalogId === 'kitchen_stove_unit') {
        ctx.strokeRect(-fw * 0.4, -fd * 0.36, fw * 0.8, fd * 0.72);
        const bRad = Math.max(3, Math.min(fw, fd) * 0.12);
        const bOff = [
          [-fw * 0.2, -fd * 0.15],
          [fw * 0.2, -fd * 0.15],
          [-fw * 0.2, fd * 0.15],
          [fw * 0.2, fd * 0.15],
        ];
        ctx.strokeStyle = '#475569';
        bOff.forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, bRad, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.font = '600 9px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAS HOB', 0, 0);
      } else if (furn.catalogId === 'toilet_commode') {
        ctx.strokeRect(-fw / 2, -fd / 2, fw, fd * 0.32);
        ctx.beginPath();
        ctx.ellipse(0, fd * 0.15, fw * 0.38, fd * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '600 9px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WC', 0, fd * 0.15);
      } else if (furn.catalogId === 'washbasin_vanity') {
        ctx.beginPath();
        ctx.ellipse(0, 0, fw * 0.36, fd * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.arc(0, -fd * 0.22, 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '600 8px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('WASHBASIN', 0, fd / 2 - 2);
      } else if (furn.catalogId === 'porch_car') {
        // Architectural Car Parking Bay with car silhouette
        const cw = fw * 0.7;
        const cd = fd * 0.8;

        // Car body outline
        ctx.strokeStyle = isFurnSelected ? '#2563eb' : '#475569';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(-cw / 2, -cd / 2, cw, cd);

        // Windshield and rear glass lines
        ctx.beginPath();
        ctx.moveTo(-cw * 0.4, -cd * 0.22);
        ctx.lineTo(cw * 0.4, -cd * 0.22);
        ctx.moveTo(-cw * 0.4, cd * 0.24);
        ctx.lineTo(cw * 0.4, cd * 0.24);
        // Cabin roof sides
        ctx.moveTo(-cw * 0.36, -cd * 0.22);
        ctx.lineTo(-cw * 0.36, cd * 0.24);
        ctx.moveTo(cw * 0.36, -cd * 0.22);
        ctx.lineTo(cw * 0.36, cd * 0.24);
        ctx.stroke();

        // Wheels / tires
        const tw = Math.max(3, cw * 0.14);
        const th = Math.max(6, cd * 0.18);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-cw / 2 - tw * 0.4, -cd * 0.38, tw, th);
        ctx.fillRect(cw / 2 - tw * 0.6, -cd * 0.38, tw, th);
        ctx.fillRect(-cw / 2 - tw * 0.4, cd * 0.2, tw, th);
        ctx.fillRect(cw / 2 - tw * 0.6, cd * 0.2, tw, th);

        // Bold parking label
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PARKING / CAR', 0, 0);
      } else if (furn.catalogId === 'entry_gate') {
        // Gate posts at left and right
        const pillarW = Math.min(fw * 0.12, 18);
        ctx.fillStyle = isFurnSelected ? '#2563eb' : '#334155';
        ctx.fillRect(-fw / 2, -fd / 2, pillarW, fd);
        ctx.fillRect(fw / 2 - pillarW, -fd / 2, pillarW, fd);

        // Sliding/swing track dashed line
        ctx.strokeStyle = isFurnSelected ? '#2563eb' : '#0284c7';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(-fw / 2 + pillarW, 0);
        ctx.lineTo(fw / 2 - pillarW, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '700 9px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#0369a1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀══ MAIN GATE ══▶', 0, 0);
      } else if (furn.catalogId === 'coffee_table') {
        ctx.fillStyle = isFurnSelected ? '#bfdbfe' : '#f8fafc';
        ctx.fillRect(-fw * 0.45, -fd * 0.45, fw * 0.9, fd * 0.9);
        ctx.strokeRect(-fw * 0.45, -fd * 0.45, fw * 0.9, fd * 0.9);

        ctx.font = '600 8px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COFFEE TABLE', 0, 0);
      } else {
        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = isFurnSelected ? '#1d4ed8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(furn.name.toUpperCase(), 0, 0);
      }

      if (isFurnSelected) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-fw / 2 - 4, -fd / 2 - 4, fw + 8, fd + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // Render Modular Kitchens (Countertop slabs, base/wall cabinets, sink & hob)
    if (project.settings.showKitchens !== false) {
      for (const kitchen of activeFloor.kitchens || []) {
        drawKitchenDesign(ctx, kitchen, worldToScreen, pxPerSixteenth);
      }
    }

    // Compute Mitered Wall Polygons
    const miterMap = computeMiteredWallPolygons(activeFloor);

    // Draw Walls in High-Contrast Slate
    for (const wall of activeFloor.walls) {
      const isSelected = wall.id === selectedWallId;
      const p1 = worldToScreen(wall.start.x, wall.start.y);
      const p2 = worldToScreen(wall.end.x, wall.end.y);
      const len = wallLength(wall);
      const angle = wallAngle(wall);
      const thicknessPx = Math.max(3, wall.thickness * pxPerSixteenth);

      const miterPoly = miterMap.get(wall.id);

      ctx.save();
      // Wall polygon fill
      ctx.beginPath();
      if (miterPoly && miterPoly.length >= 4) {
        const first = worldToScreen(miterPoly[0].x, miterPoly[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < miterPoly.length; i++) {
          const pt = worldToScreen(miterPoly[i].x, miterPoly[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
      } else {
        const perpX = -Math.sin(angle) * (thicknessPx / 2);
        const perpY = -Math.cos(angle) * (thicknessPx / 2);
        ctx.moveTo(p1.x + perpX, p1.y + perpY);
        ctx.lineTo(p2.x + perpX, p2.y + perpY);
        ctx.lineTo(p2.x - perpX, p2.y - perpY);
        ctx.lineTo(p1.x - perpX, p1.y - perpY);
      }
      ctx.closePath();

      ctx.fillStyle = isSelected ? '#2563eb' : '#2b3040'; // Deep architectural slate
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#1d4ed8' : '#1f2430';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      // Wall Centerline
      ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const perpX = -Math.sin(angle) * (thicknessPx / 2);
      const perpY = -Math.cos(angle) * (thicknessPx / 2);

      // Draw Wall Openings (Doors & Windows)
      for (const op of wall.openings) {
        const isOpSelected = op.id === selectedOpeningId;
        const opOffset = op.offsetAlongWall;
        const opStartOffset = Math.max(0, opOffset - op.width / 2);
        const opEndOffset = Math.min(len, opOffset + op.width / 2);

        const opP1 = worldToScreen(
          Math.round(wall.start.x + Math.cos(angle) * opStartOffset),
          Math.round(wall.start.y + Math.sin(angle) * opStartOffset)
        );
        const opP2 = worldToScreen(
          Math.round(wall.start.x + Math.cos(angle) * opEndOffset),
          Math.round(wall.start.y + Math.sin(angle) * opEndOffset)
        );

        // Clear opening background to white
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(opP1.x + perpX * 1.05, opP1.y + perpY * 1.05);
        ctx.lineTo(opP2.x + perpX * 1.05, opP2.y + perpY * 1.05);
        ctx.lineTo(opP2.x - perpX * 1.05, opP2.y - perpY * 1.05);
        ctx.lineTo(opP1.x - perpX * 1.05, opP1.y - perpY * 1.05);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (isOpSelected) {
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (op.type === 'door') {
          // Door swing arc
          const doorWidthPx = op.width * pxPerSixteenth;
          ctx.strokeStyle = isOpSelected ? '#2563eb' : '#d97706';
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          ctx.moveTo(opP1.x, opP1.y);
          const leafAngle = angle + (op.flipInward ? -Math.PI / 2 : Math.PI / 2);
          const leafEnd = {
            x: opP1.x + Math.cos(leafAngle) * doorWidthPx,
            y: opP1.y + Math.sin(leafAngle) * doorWidthPx,
          };
          ctx.lineTo(leafEnd.x, leafEnd.y);
          ctx.stroke();

          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(opP1.x, opP1.y, doorWidthPx, leafAngle, angle, !op.flipInward);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (op.type === 'window') {
          // Window double glass line
          ctx.strokeStyle = isOpSelected ? '#2563eb' : '#0284c7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(opP1.x, opP1.y);
          ctx.lineTo(opP2.x, opP2.y);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(opP1.x + perpX * 0.4, opP1.y + perpY * 0.4);
          ctx.lineTo(opP2.x + perpX * 0.4, opP2.y + perpY * 0.4);
          ctx.moveTo(opP1.x - perpX * 0.4, opP1.y - perpY * 0.4);
          ctx.lineTo(opP2.x - perpX * 0.4, opP2.y - perpY * 0.4);
          ctx.stroke();
        } else if (op.type === 'ventilator') {
          // High-Sill Ventilator: double dashed lines and bold green badge
          ctx.strokeStyle = isOpSelected ? '#2563eb' : '#059669';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(opP1.x + perpX * 0.35, opP1.y + perpY * 0.35);
          ctx.lineTo(opP2.x + perpX * 0.35, opP2.y + perpY * 0.35);
          ctx.moveTo(opP1.x - perpX * 0.35, opP1.y - perpY * 0.35);
          ctx.lineTo(opP2.x - perpX * 0.35, opP2.y - perpY * 0.35);
          ctx.stroke();
          ctx.setLineDash([]);

          const midOpX = (opP1.x + opP2.x) / 2;
          const midOpY = (opP1.y + opP2.y) / 2;
          ctx.fillStyle = isOpSelected ? '#1d4ed8' : '#059669';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('VENT', midOpX, midOpY);
        }
        ctx.restore();
      }

      // Wall Dimension Label (Clear High-Contrast Badge)
      const midPoint = {
        x: (p1.x + p2.x) / 2 + perpX * 1.5,
        y: (p1.y + p2.y) / 2 + perpY * 1.5,
      };
      const dimText = formatFeetInches(len);

      ctx.save();
      ctx.translate(midPoint.x, midPoint.y);
      let textAngle = angle;
      if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
        textAngle += Math.PI;
      }
      ctx.rotate(textAngle);

      ctx.font = '600 11px "SF Mono", Menlo, monospace';
      const textMetrics = ctx.measureText(dimText);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-textMetrics.width / 2 - 5, -8, textMetrics.width + 10, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#1d4ed8' : '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dimText, 0, 0);
      ctx.restore();

      // Selected Endpoint Handles
      if (isSelected) {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw MEP Symbols Layer
    if (project.settings.showMepLayer !== false) {
      for (const sym of activeFloor.symbols || []) {
        const sc = worldToScreen(sym.position.x, sym.position.y);
        render2DMepSymbol(ctx, sym, sc, sym.id === selectedSymbolId, zoom);
      }
    }

    // Draw Smart Alignment Guidelines (Cyan Dashed)
    if (activeGuidelines.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);

      for (const guide of activeGuidelines) {
        ctx.beginPath();
        if (guide.type === 'vertical') {
          const screenX = worldToScreen(guide.coordinate, 0).x;
          ctx.moveTo(screenX, 0);
          ctx.lineTo(screenX, height);
        } else {
          const screenY = worldToScreen(0, guide.coordinate).y;
          ctx.moveTo(0, screenY);
          ctx.lineTo(width, screenY);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Live Hover Ghost Opening (for Door, Window, or Ventilator Tool)
    if ((activeTool === 'door' || activeTool === 'window' || activeTool === 'ventilator') && hoverOpeningWall) {
      const { wall, offset } = hoverOpeningWall;
      const angle = wallAngle(wall);
      const isDoor = activeTool === 'door';
      const isVent = activeTool === 'ventilator';
      const settings = project.settings;
      const opWidth = isDoor
        ? (settings.defaultDoorWidth ?? feetInchesToSixteenths(3, 0))
        : isVent
        ? (settings.defaultVentilatorWidth ?? feetInchesToSixteenths(2, 0))
        : (settings.defaultWindowWidth ?? feetInchesToSixteenths(4, 0));

      const opStartOffset = Math.max(0, offset - opWidth / 2);
      const opEndOffset = Math.min(wallLength(wall), offset + opWidth / 2);

      const p1 = worldToScreen(
        Math.round(wall.start.x + Math.cos(angle) * opStartOffset),
        Math.round(wall.start.y + Math.sin(angle) * opStartOffset)
      );
      const p2 = worldToScreen(
        Math.round(wall.start.x + Math.cos(angle) * opEndOffset),
        Math.round(wall.start.y + Math.sin(angle) * opEndOffset)
      );

      ctx.save();
      ctx.strokeStyle = isDoor ? '#d97706' : isVent ? '#059669' : '#0284c7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (isDoor) {
        const doorWidthPx = opWidth * pxPerSixteenth;
        const leafAngle = angle + (flipInward ? -Math.PI / 2 : Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + Math.cos(leafAngle) * doorWidthPx, p1.y + Math.sin(leafAngle) * doorWidthPx);
        ctx.stroke();
      } else if (isVent) {
        // High-sill ventilator dash symbol
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Distance badge from corner
      const distFromStart = formatFeetInches(offset);
      ctx.font = '600 11px "SF Mono", Menlo, monospace';
      const labelPrefix = isDoor ? 'Door' : isVent ? 'Ventilator (6\'6" sill)' : 'Window';
      const textBadge = `${labelPrefix}: ${distFromStart} from corner (F: flip)`;
      const bTm = ctx.measureText(textBadge);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 24;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(midX - bTm.width / 2 - 8, midY - 9, bTm.width + 16, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textBadge, midX, midY);
      ctx.restore();
    }

    // Active Rubberband Wall (While Drawing with Wall Tool)
    if (activeTool === 'wall' && wallStartPoint && currentCursorPoint) {
      const p1 = worldToScreen(wallStartPoint.x, wallStartPoint.y);
      const p2 = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
      const liveLen = Math.round(distance2D(wallStartPoint, currentCursorPoint));
      const liveThickPx = Math.max(3, activeThickness * pxPerSixteenth);

      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = liveThickPx;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Dimension Badge
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 16;
      const liveText = formatFeetInches(liveLen);

      ctx.font = '600 12px "SF Mono", Menlo, monospace';
      const tm = ctx.measureText(liveText);
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(midX - tm.width / 2 - 8, midY - 10, tm.width + 16, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(liveText, midX, midY);
      ctx.restore();
    }

    // Render Roof 2D Geometry if present
    if (activeFloor.roof && activeFloor.roof.visible !== false) {
      const rGeom = getRoof2DGeometry(activeFloor.roof, activeFloor.walls);
      ctx.save();
      if (rGeom.eaveOutline.length >= 4) {
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const ep0 = worldToScreen(rGeom.eaveOutline[0].x, rGeom.eaveOutline[0].y);
        ctx.moveTo(ep0.x, ep0.y);
        for (let i = 1; i < rGeom.eaveOutline.length; i++) {
          const pt = worldToScreen(rGeom.eaveOutline[i].x, rGeom.eaveOutline[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      for (const rl of rGeom.ridgeLines) {
        const rp1 = worldToScreen(rl.start.x, rl.start.y);
        const rp2 = worldToScreen(rl.end.x, rl.end.y);
        ctx.beginPath();
        ctx.moveTo(rp1.x, rp1.y);
        ctx.lineTo(rp2.x, rp2.y);
        ctx.stroke();

        ctx.font = '600 10px "SF Mono", Menlo, monospace';
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`RIDGE (${activeFloor.roof.pitch}/12 PITCH)`, (rp1.x + rp2.x) / 2, (rp1.y + rp2.y) / 2 - 4);
      }

      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      for (const hl of rGeom.hipLines) {
        const hp1 = worldToScreen(hl.start.x, hl.start.y);
        const hp2 = worldToScreen(hl.end.x, hl.end.y);
        ctx.beginPath();
        ctx.moveTo(hp1.x, hp1.y);
        ctx.lineTo(hp2.x, hp2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hover Preview for Column Tool
    if (activeTool === 'column' && currentCursorPoint) {
      const cp = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
      const colSizePx = Math.max(8, 192 * pxPerSixteenth); // 12" = 192
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(-placementRotation);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.fillRect(-colSizePx / 2, -colSizePx / 2, colSizePx, colSizePx);
      ctx.strokeRect(-colSizePx / 2, -colSizePx / 2, colSizePx, colSizePx);
      ctx.restore();
    }

    // Hover Preview for Stair Tool
    if (activeTool === 'stair' && currentCursorPoint) {
      const sp = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
      const stairWidthPx = Math.max(12, 576 * pxPerSixteenth); // 3' = 576
      const stairRunPx = Math.max(20, 1600 * pxPerSixteenth);   // ~8' run
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(-placementRotation);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -stairWidthPx / 2, stairRunPx, stairWidthPx);
      ctx.strokeRect(0, -stairWidthPx / 2, stairRunPx, stairWidthPx);
      ctx.restore();
    }

    // Hover Preview for Furniture Tool
    if (activeTool === 'furniture' && currentCursorPoint) {
      const activeCatItem =
        FURNITURE_CATALOG.find((c) => c.id === activeFurnitureCatalogId) ||
        FURNITURE_CATALOG[0];
      const fp = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
      const fw = activeCatItem.defaultDimensions.width * pxPerSixteenth;
      const fd = activeCatItem.defaultDimensions.depth * pxPerSixteenth;
      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(-placementRotation);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.fillRect(-fw / 2, -fd / 2, fw, fd);
      ctx.strokeRect(-fw / 2, -fd / 2, fw, fd);
      ctx.restore();

      // Pill label above preview
      const previewLabel = `${activeCatItem.name} (${formatFeetInches(activeCatItem.defaultDimensions.width)} × ${formatFeetInches(activeCatItem.defaultDimensions.depth)})`;
      ctx.save();
      ctx.font = '600 11px sans-serif';
      const textMetrics = ctx.measureText(previewLabel);
      const pillPad = 6;
      const pillW = textMetrics.width + pillPad * 2;
      const pillH = 18;
      const pillY = fp.y - fd / 2 - 24;

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.beginPath();
      ctx.roundRect(fp.x - pillW / 2, pillY, pillW, pillH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(previewLabel, fp.x, pillY + pillH / 2);
      ctx.restore();
    }

    // Hover Preview for MEP Tool
    if (activeTool === 'mep' && currentCursorPoint) {
      const sp = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
      const catItem = MEP_CATALOG.find((c) => c.type === (activeSymbolType || 'light_point')) || MEP_CATALOG[0];
      const dummySym: ArchitecturalSymbol = {
        id: 'preview',
        floorId: activeFloor.id,
        name: catItem.name,
        type: catItem.type,
        category: catItem.category,
        position: currentCursorPoint,
        rotation: placementRotation,
        elevation: catItem.defaultElevation,
      };
      ctx.save();
      ctx.globalAlpha = 0.75;
      render2DMepSymbol(ctx, dummySym, sp, false, zoom);
      ctx.restore();

      const previewLabel = `⚡ ${catItem.name} — [R] Rotate • [1-9] Switch`;
      ctx.save();
      ctx.font = '600 11px sans-serif';
      const textMetrics = ctx.measureText(previewLabel);
      const pillPad = 6;
      const pillW = textMetrics.width + pillPad * 2;
      const pillH = 18;
      const pillY = sp.y - 28;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(sp.x - pillW / 2, pillY, pillW, pillH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(previewLabel, sp.x, pillY + pillH / 2);
      ctx.restore();
    }

    // Interactive 2-Point Calibration Guide Line
    if (isCalibrating && calibPoint1) {
      const p1Screen = worldToScreen(calibPoint1.x, calibPoint1.y);
      ctx.save();

      // Point 1 Crosshairs & Circle Target
      ctx.strokeStyle = '#0284c7';
      ctx.fillStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p1Screen.x, p1Screen.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p1Screen.x - 16, p1Screen.y);
      ctx.lineTo(p1Screen.x + 16, p1Screen.y);
      ctx.moveTo(p1Screen.x, p1Screen.y - 16);
      ctx.lineTo(p1Screen.x, p1Screen.y + 16);
      ctx.stroke();

      // Connecting line to cursor
      if (currentCursorPoint) {
        const p2Screen = worldToScreen(currentCursorPoint.x, currentCursorPoint.y);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1Screen.x, p1Screen.y);
        ctx.lineTo(p2Screen.x, p2Screen.y);
        ctx.stroke();

        // Pixel distance badge
        const midX = (p1Screen.x + p2Screen.x) / 2;
        const midY = (p1Screen.y + p2Screen.y) / 2;
        const curDistUnits = getPointDistance(calibPoint1, currentCursorPoint);
        const refPlan = activeFloor.referencePlan;
        const pxDist = curDistUnits / (refPlan?.scale || 16);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(midX - 55, midY - 14, 110, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(pxDist)} px (Click P2)`, midX, midY);
      }
      ctx.restore();
    }

    // First-Person Walkthrough Minimap Radar
    if (walkCameraState) {
      const camScreen = worldToScreen(walkCameraState.x, walkCameraState.y);
      const yaw = walkCameraState.yaw;
      ctx.save();
      ctx.translate(camScreen.x, camScreen.y);

      // Vision cone arc (60 degree field of view)
      const fovRad = (60 * Math.PI) / 180;
      const coneLength = 55 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coneLength, -yaw - fovRad / 2, -yaw + fovRad / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye position dot
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 2D Interactive Rotation Handle on Selected Object
    const selCenterObj = getSelectedObjectCenter(
      activeFloor,
      selectedFurnitureId ?? null,
      selectedColumnId ?? null,
      selectedStairId ?? null,
      selectedWallId
    );
    if (selCenterObj) {
      const cSc = worldToScreen(selCenterObj.center.x, selCenterObj.center.y);
      const hSc = { x: cSc.x, y: cSc.y - (selCenterObj.boundHalfH * pxPerSixteenth + 28) };

      ctx.save();
      // Dashed connection stem
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cSc.x, cSc.y);
      ctx.lineTo(hSc.x, hSc.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center pivot point
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(cSc.x, cSc.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Circular Rotation Grip Handle
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(hSc.x, hSc.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curved rotation arrow icon inside circle
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(hSc.x, hSc.y, 4.5, -Math.PI * 0.8, Math.PI * 0.5);
      ctx.stroke();

      // Degree readout pill next to handle
      const normDeg = Math.round(((selCenterObj.angle * 180 / Math.PI) % 360 + 360) % 360);
      const degText = `${normDeg}°`;
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(hSc.x + 14, hSc.y - 10, 36, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(degText, hSc.x + 32, hSc.y);

      ctx.restore();
    }

    // Architectural Building Section Cuts (e.g. Section A-A')
    for (const cut of activeFloor.sections || []) {
      const isSelected = selectedSectionId === cut.id;
      const s1 = worldToScreen(cut.p1.x, cut.p1.y);
      const s2 = worldToScreen(cut.p2.x, cut.p2.y);
      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      const len = Math.hypot(dx, dy);
      if (len < 10) continue;

      const nx = -dy / len;
      const ny = dx / len;
      const sign = cut.viewDirection === 'right' ? 1 : -1;

      ctx.save();
      // Main dashed-dotted cutting line (ISO Architectural standard)
      ctx.strokeStyle = isSelected ? '#2563eb' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.setLineDash([14, 4, 3, 4]);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Section Cut End Callouts (Bubbles & Directional Arrows)
      const renderSectionEnd = (pt: { x: number; y: number }) => {
        const bubbleR = 14;
        const arrowDist = bubbleR + 15;
        const arrowTipX = pt.x + sign * nx * arrowDist;
        const arrowTipY = pt.y + sign * ny * arrowDist;

        ctx.strokeStyle = isSelected ? '#2563eb' : '#0f172a';
        ctx.fillStyle = isSelected ? '#2563eb' : '#0f172a';
        ctx.lineWidth = 2;

        // Arrow stem
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(arrowTipX, arrowTipY);
        ctx.stroke();

        // Arrow tip triangle
        const tDx = dx / len;
        const tDy = dy / len;
        ctx.beginPath();
        ctx.moveTo(arrowTipX, arrowTipY);
        ctx.lineTo(
          arrowTipX - sign * nx * 7 + tDx * 5,
          arrowTipY - sign * ny * 7 + tDy * 5
        );
        ctx.lineTo(
          arrowTipX - sign * nx * 7 - tDx * 5,
          arrowTipY - sign * ny * 7 - tDy * 5
        );
        ctx.closePath();
        ctx.fill();

        // Callout Bubble Circle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = isSelected ? '#2563eb' : '#0f172a';
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, bubbleR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bubble horizontal divider line
        ctx.beginPath();
        ctx.moveTo(pt.x - bubbleR, pt.y);
        ctx.lineTo(pt.x + bubbleR, pt.y);
        ctx.stroke();

        // Bubble top text: Section letter
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cut.label || 'A', pt.x, pt.y - 6);

        // Bubble bottom text: Sheet reference
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText(cut.sheetRef || 'A-301', pt.x, pt.y + 6.5);

        // Interactive drag grip handle when selected
        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(pt.x - 4, pt.y - 4, 8, 8);
          ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        }
      };

      renderSectionEnd(s1);
      renderSectionEnd(s2);

      ctx.restore();
    }

    // Architectural North Arrow Symbol (Canvas Corner)
    ctx.save();
    const naX = width - 40;
    const naY = 40;
    ctx.translate(naX, naY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-5, 7);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -19);
    ctx.restore();

    ctx.restore();
  }, [
    project,
    activeFloor,
    selectedWallId,
    selectedOpeningId,
    selectedRoomId,
    selectedStairId,
    selectedColumnId,
    selectedFurnitureId,
    selectedSymbolId,
    activeSymbolType,
    placementRotation,
    isCalibrating,
    calibPoint1,
    walkCameraState,
    activeTool,
    wallStartPoint,
    currentCursorPoint,
    activeGuidelines,
    hoverOpeningWall,
    flipInward,
    pan,
    zoom,
    activeThickness,
    worldToScreen,
  ]);

  // Architectural Rulers (Clean Light Styling)
  useEffect(() => {
    const topCanvas = rulerTopRef.current;
    const leftCanvas = rulerLeftRef.current;
    if (!topCanvas || !leftCanvas || !canvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const topWidth = topCanvas.clientWidth;
    const topHeight = topCanvas.clientHeight;
    const leftWidth = leftCanvas.clientWidth;
    const leftHeight = leftCanvas.clientHeight;

    topCanvas.width = topWidth * dpr;
    topCanvas.height = topHeight * dpr;
    leftCanvas.width = leftWidth * dpr;
    leftCanvas.height = leftHeight * dpr;

    const topCtx = topCanvas.getContext('2d');
    const leftCtx = leftCanvas.getContext('2d');
    if (!topCtx || !leftCtx) return;

    topCtx.save();
    topCtx.scale(dpr, dpr);
    topCtx.fillStyle = '#f8f9fb';
    topCtx.fillRect(0, 0, topWidth, topHeight);

    leftCtx.save();
    leftCtx.scale(dpr, dpr);
    leftCtx.fillStyle = '#f8f9fb';
    leftCtx.fillRect(0, 0, leftWidth, leftHeight);

    const pxPerFoot = 48 * zoom;
    const centerX = topWidth / 2 + pan.x;
    const centerY = leftHeight / 2 + pan.y;

    topCtx.fillStyle = '#4b5563';
    topCtx.font = '500 10px "SF Mono", Menlo, monospace';
    topCtx.strokeStyle = '#d1d5db';
    topCtx.lineWidth = 1;

    const stepFeet = zoom < 0.5 ? 10 : zoom < 1.2 ? 5 : zoom < 3 ? 2 : 1;
    const stepPx = pxPerFoot * stepFeet;

    const firstTickOffset = ((centerX % stepPx) + stepPx) % stepPx;
    for (let x = firstTickOffset; x < topWidth; x += stepPx) {
      const worldX = screenToWorld(x, 0).x;
      const feet = Math.round(worldX / SIXTEENTHS_PER_FOOT);
      topCtx.beginPath();
      topCtx.moveTo(x, topHeight - 8);
      topCtx.lineTo(x, topHeight);
      topCtx.stroke();
      topCtx.fillText(`${feet}'`, x + 3, topHeight - 10);
    }

    leftCtx.fillStyle = '#4b5563';
    leftCtx.font = '500 10px "SF Mono", Menlo, monospace';
    leftCtx.strokeStyle = '#d1d5db';
    leftCtx.lineWidth = 1;

    const firstTickY = ((centerY % stepPx) + stepPx) % stepPx;
    for (let y = firstTickY; y < leftHeight; y += stepPx) {
      const worldY = screenToWorld(0, y).y;
      const feet = Math.round(worldY / SIXTEENTHS_PER_FOOT);
      leftCtx.beginPath();
      leftCtx.moveTo(leftWidth - 8, y);
      leftCtx.lineTo(leftWidth, y);
      leftCtx.stroke();
      leftCtx.fillText(`${feet}'`, 4, y - 3);
    }

    topCtx.restore();
    leftCtx.restore();
  }, [pan, zoom, screenToWorld]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (e.button === 1 || activeTool === 'pan' || (e.shiftKey && e.button === 0)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    const rawWorld = screenToWorld(screenX, screenY);

    // Calibration Mode Point Picking
    if (isCalibrating) {
      if (!calibPoint1) {
        setCalibPoint1(rawWorld);
      } else {
        const p1 = calibPoint1;
        const p2 = rawWorld;
        const refPlan = activeFloor.referencePlan;
        if (refPlan && onCalibrationPointsPicked) {
          const currentWorldDist = getPointDistance(p1, p2);
          const pixelDist = currentWorldDist / (refPlan.scale || 16);
          onCalibrationPointsPicked(p1, p2, pixelDist);
        }
        setCalibPoint1(null);
      }
      return;
    }

    const lowerFloor = project.settings.showUnderlay !== false
      ? project.floors.find((f) => f.levelIndex === activeFloor.levelIndex - 1)
      : null;
    const snapWalls = lowerFloor ? [...activeFloor.walls, ...lowerFloor.walls] : activeFloor.walls;

    const snapResult = calculateCADSnap(
      rawWorld,
      snapWalls,
      snapGrid,
      orthogonalSnap,
      wallStartPoint
    );

    // Column Placement Tool
    if (activeTool === 'column') {
      if (onAddColumn) {
        const col = {
          ...createDefaultColumn(activeFloor.id, snapResult.point, 'rectangular', activeFloor.ceilingHeight),
          rotation: placementRotation,
        };
        onAddColumn(col);
        if (onSelectColumn) onSelectColumn(col.id);
      }
      return;
    }

    // Staircase Placement Tool
    if (activeTool === 'stair') {
      if (onAddStaircase) {
        const stair = {
          ...createDefaultStaircase(activeFloor.id, snapResult.point, getFloorRise(activeFloor), 'straight'),
          angle: placementRotation,
        };
        onAddStaircase(stair);
        if (onSelectStair) onSelectStair(stair.id);
      }
      return;
    }

    // Roof Tool
    if (activeTool === 'roof') {
      if (onOpenRoofConfig) onOpenRoofConfig();
      return;
    }

    // Flooring Studio Tool
    if (activeTool === 'flooring') {
      let hitRoom: any = null;
      for (const room of activeFloor.rooms) {
        if (room.polygon.length >= 3 && isPointInsidePolygon(rawWorld, room.polygon)) {
          hitRoom = room;
          break;
        }
      }
      if (hitRoom) {
        if (onSelectRoom) onSelectRoom(hitRoom.id);
        if (onOpenFlooringStudio) onOpenFlooringStudio(hitRoom.id);
      } else {
        if (onOpenFlooringStudio) onOpenFlooringStudio(undefined);
      }
      return;
    }

    // Furniture Placement Tool
    if (activeTool === 'furniture') {
      if (onAddFurniture) {
        const catId = activeFurnitureCatalogId || 'bed_queen';
        const furn = {
          ...createFurnitureInstance(catId, activeFloor.id, snapResult.point),
          rotation: placementRotation,
        };
        onAddFurniture(furn);
        if (onSelectFurniture) onSelectFurniture(furn.id);
      }
      return;
    }

    // MEP Fixture Placement Tool
    if (activeTool === 'mep') {
      if (onAddSymbol) {
        const sym = createDefaultMepSymbol(
          activeSymbolType || 'light_point',
          activeFloor.id,
          snapResult.point,
          placementRotation
        );
        onAddSymbol(sym);
        if (onSelectSymbol) onSelectSymbol(sym.id);
      }
      return;
    }

    // Door, Window, or Ventilator Placement Tool
    if (activeTool === 'door' || activeTool === 'window' || activeTool === 'ventilator') {
      if (hoverOpeningWall) {
        const { wall, offset } = hoverOpeningWall;
        const isDoor = activeTool === 'door';
        const isVent = activeTool === 'ventilator';
        const settings = project.settings;
        const width = isDoor
          ? (settings.defaultDoorWidth ?? feetInchesToSixteenths(3, 0))
          : isVent
          ? (settings.defaultVentilatorWidth ?? feetInchesToSixteenths(2, 0))
          : (settings.defaultWindowWidth ?? feetInchesToSixteenths(4, 0));
        const height = isDoor
          ? (settings.defaultDoorHeight ?? feetInchesToSixteenths(7, 0))
          : isVent
          ? (settings.defaultVentilatorHeight ?? feetInchesToSixteenths(1, 6))
          : (settings.defaultWindowHeight ?? feetInchesToSixteenths(4, 0));
        const elev = isDoor
          ? 0
          : isVent
          ? (settings.defaultVentilatorSillHeight ?? feetInchesToSixteenths(6, 6))
          : (settings.defaultWindowSillHeight ?? feetInchesToSixteenths(3, 0));

        const newOp: WallOpening = {
          id: `op_${isDoor ? 'door' : isVent ? 'vent' : 'win'}_${Date.now()}`,
          wallId: wall.id,
          name: isDoor ? 'Hinged Door' : isVent ? 'High-Sill Ventilator' : 'Casement Window',
          type: isVent ? 'ventilator' : (isDoor ? 'door' : 'window'),
          offsetAlongWall: offset,
          width,
          height,
          elevation: elev,
          flipInward,
          flipHand,
        };

        onAddOpening(wall.id, newOp);
        if (onSelectOpening) onSelectOpening(newOp.id, wall.id);
      }
      return;
    }

    // Wall Tool
    if (activeTool === 'wall') {
      if (!wallStartPoint) {
        setWallStartPoint(snapResult.point);
      } else {
        if (distance2D(wallStartPoint, snapResult.point) > 16) {
          onAddWall(wallStartPoint, snapResult.point, activeThickness);
          setWallStartPoint(snapResult.point);
        }
      }
      return;
    }

    // Select Tool
    if (activeTool === 'select') {
      // Check rotation handle on currently selected item first
      const selObj = getSelectedObjectCenter(
        activeFloor,
        selectedFurnitureId ?? null,
        selectedColumnId ?? null,
        selectedStairId ?? null,
        selectedWallId,
        selectedSymbolId ?? null
      );
      if (selObj) {
        const pxPerSixteenth = (48 * zoom) / SIXTEENTHS_PER_FOOT;
        const cSc = worldToScreen(selObj.center.x, selObj.center.y);
        const handleSc = { x: cSc.x, y: cSc.y - (selObj.boundHalfH * pxPerSixteenth + 28) };
        if (Math.hypot(screenX - handleSc.x, screenY - handleSc.y) <= 15) {
          setDragMode('rotate');
          setDragRotateOrigin(selObj.center);
          setDragRotateItemType(selObj.type);
          return;
        }
      }

      // Check outdoor features (Pool, Deck, Patio, Driveway, Trees, Fences)
      if (project.site && project.site.features) {
        for (const feat of project.site.features) {
          const halfW = feat.width / 2;
          const halfD = feat.depth / 2;
          if (
            rawWorld.x >= feat.position.x - halfW &&
            rawWorld.x <= feat.position.x + halfW &&
            rawWorld.y >= feat.position.y - halfD &&
            rawWorld.y <= feat.position.y + halfD
          ) {
            if (onSelectOutdoorFeature) onSelectOutdoorFeature(feat.id);
            onSelectWall(null);
            if (onSelectRoom) onSelectRoom(null);
            if (onSelectOpening) onSelectOpening(null, null);
            if (onSelectColumn) onSelectColumn(null);
            if (onSelectStair) onSelectStair(null);
            if (onSelectFurniture) onSelectFurniture(null);
            if (onSelectSymbol) onSelectSymbol(null);
            if (onSelectSection) onSelectSection(null);
            return;
          }
        }
      }

      // 0. Check click on Architectural Section Cuts
      for (const cut of activeFloor.sections || []) {
        const d1 = distance2D(rawWorld, cut.p1);
        const d2 = distance2D(rawWorld, cut.p2);
        const handleHitRadius = 320; // Sixteenths
        if (d1 <= handleHitRadius) {
          if (onSelectSection) onSelectSection(cut.id);
          onSelectWall(null);
          if (onSelectRoom) onSelectRoom(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          if (onSelectStair) onSelectStair(null);
          if (onSelectFurniture) onSelectFurniture(null);
          if (onSelectSymbol) onSelectSymbol(null);
          setDragMode('section_p1');
          setDragSectionCutId(cut.id);
          setDragSectionStart({ p1: { ...cut.p1 }, p2: { ...cut.p2 } });
          setDragMouseOrigin(rawWorld);
          return;
        }
        if (d2 <= handleHitRadius) {
          if (onSelectSection) onSelectSection(cut.id);
          onSelectWall(null);
          if (onSelectRoom) onSelectRoom(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          if (onSelectStair) onSelectStair(null);
          if (onSelectFurniture) onSelectFurniture(null);
          if (onSelectSymbol) onSelectSymbol(null);
          setDragMode('section_p2');
          setDragSectionCutId(cut.id);
          setDragSectionStart({ p1: { ...cut.p1 }, p2: { ...cut.p2 } });
          setDragMouseOrigin(rawWorld);
          return;
        }
        const proj = projectPointOntoSegment(rawWorld, cut.p1, cut.p2);
        if (proj.distance <= 200) {
          if (onSelectSection) onSelectSection(cut.id);
          onSelectWall(null);
          if (onSelectRoom) onSelectRoom(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          if (onSelectStair) onSelectStair(null);
          if (onSelectFurniture) onSelectFurniture(null);
          if (onSelectSymbol) onSelectSymbol(null);
          setDragMode('section_body');
          setDragSectionCutId(cut.id);
          setDragSectionStart({ p1: { ...cut.p1 }, p2: { ...cut.p2 } });
          setDragMouseOrigin(rawWorld);
          return;
        }
      }
      if (onSelectSection) onSelectSection(null);

      // 0. Check click on MEP symbols
      for (const sym of activeFloor.symbols || []) {
        if (distance2D(rawWorld, sym.position) <= 240) {
          if (onSelectSymbol) onSelectSymbol(sym.id);
          onSelectWall(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          if (onSelectStair) onSelectStair(null);
          if (onSelectFurniture) onSelectFurniture(null);
          if (onSelectRoom) onSelectRoom(null);
          setDragMode('symbol');
          setDragItemStartPos({ ...sym.position });
          setDragMouseOrigin(rawWorld);
          return;
        }
      }
      if (onSelectSymbol) onSelectSymbol(null);

      // 0. Check click on furniture & fixtures
      for (const furn of activeFloor.furniture || []) {
        if (isPointInsideFurniture(rawWorld, furn)) {
          if (onSelectFurniture) onSelectFurniture(furn.id);
          onSelectWall(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          if (onSelectStair) onSelectStair(null);
          setDragMode('furniture');
          setDragItemStartPos({ ...furn.position });
          setDragMouseOrigin(rawWorld);
          return;
        }
      }
      if (onSelectFurniture) onSelectFurniture(null);

      // 1. Check click on columns
      for (const col of activeFloor.columns || []) {
        if (isPointInsideColumn(rawWorld, col)) {
          if (onSelectColumn) onSelectColumn(col.id);
          onSelectWall(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectStair) onSelectStair(null);
          setDragMode('column');
          setDragItemStartPos({ ...col.position });
          setDragMouseOrigin(rawWorld);
          return;
        }
      }

      // 2. Check click on staircases
      for (const stair of activeFloor.stairs || []) {
        const fp = getStaircaseFootprint(stair);
        if (isPointInPoly(rawWorld, fp)) {
          if (onSelectStair) onSelectStair(stair.id);
          onSelectWall(null);
          if (onSelectOpening) onSelectOpening(null, null);
          if (onSelectColumn) onSelectColumn(null);
          setDragMode('stair');
          setDragItemStartPos({ ...stair.startPoint });
          setDragMouseOrigin(rawWorld);
          return;
        }
      }

      // Deselect stair & column if clicking something else
      if (onSelectStair) onSelectStair(null);
      if (onSelectColumn) onSelectColumn(null);

      for (const wall of activeFloor.walls) {
        for (const op of wall.openings) {
          const angle = wallAngle(wall);
          const opCenter: Point2D = {
            x: Math.round(wall.start.x + Math.cos(angle) * op.offsetAlongWall),
            y: Math.round(wall.start.y + Math.sin(angle) * op.offsetAlongWall),
          };
          if (distance2D(rawWorld, opCenter) < op.width / 2 + 32) {
            onSelectWall(wall.id);
            if (onSelectOpening) onSelectOpening(op.id, wall.id);
            setDragMode('opening');
            setDragMouseOrigin(rawWorld);
            return;
          }
        }
      }

      if (onSelectOpening) onSelectOpening(null, null);

      const junctionSnapThreshold = 192;
      let clickedJunctionPoint: Point2D | null = null;

      for (const wall of activeFloor.walls) {
        if (distance2D(rawWorld, wall.start) < junctionSnapThreshold) {
          clickedJunctionPoint = wall.start;
          break;
        }
        if (distance2D(rawWorld, wall.end) < junctionSnapThreshold) {
          clickedJunctionPoint = wall.end;
          break;
        }
      }

      if (clickedJunctionPoint) {
        const connected = getConnectedWallsAtPoint(activeFloor.walls, clickedJunctionPoint, 24);
        if (connected.length > 0) {
          onSelectWall(connected[0].wall.id);
          setDragMode('junction');
          setDragJunctionOrigin(clickedJunctionPoint);
          setDragConnectedWalls(
            connected.map((c) => ({
              wall: c.wall,
              isStart: c.isStart,
              origStart: { ...c.wall.start },
              origEnd: { ...c.wall.end },
            }))
          );
          setDragMouseOrigin(rawWorld);
          return;
        }
      }

      let hitWall: Wall | null = null;
      for (const wall of activeFloor.walls) {
        const proj = projectPointOntoSegment(rawWorld, wall.start, wall.end);
        if (proj.distance < wall.thickness / 2 + 160) {
          hitWall = wall;
          break;
        }
      }

      if (hitWall) {
        onSelectWall(hitWall.id);
        if (onSelectRoom) onSelectRoom(null);
        setDragMode('wall');
        setDragWallStartPos({ start: { ...hitWall.start }, end: { ...hitWall.end } });
        setDragMouseOrigin(rawWorld);
      } else {
        // Check if user clicked inside an enclosed room polygon
        let hitRoom: any = null;
        for (const room of activeFloor.rooms) {
          if (room.polygon.length >= 3 && isPointInsidePolygon(rawWorld, room.polygon)) {
            hitRoom = room;
            break;
          }
        }

        if (hitRoom) {
          onSelectWall(null);
          if (onSelectRoom) onSelectRoom(hitRoom.id);
          setDragMode('none');
        } else {
          onSelectWall(null);
          if (onSelectRoom) onSelectRoom(null);
          setDragMode('none');
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const rawWorld = screenToWorld(screenX, screenY);
    const lowerFloor = project.settings.showUnderlay !== false
      ? project.floors.find((f) => f.levelIndex === activeFloor.levelIndex - 1)
      : null;
    const snapWalls = lowerFloor ? [...activeFloor.walls, ...lowerFloor.walls] : activeFloor.walls;

    const snapResult = calculateCADSnap(
      rawWorld,
      snapWalls,
      snapGrid,
      orthogonalSnap,
      wallStartPoint
    );

    setCurrentCursorPoint(snapResult.point);
    setActiveGuidelines(snapResult.guidelines);
    onCursorMove(snapResult.point);

    if (activeTool === 'door' || activeTool === 'window' || activeTool === 'ventilator') {
      let nearestWall: Wall | null = null;
      let minDistance = 240;
      let bestProj: Point2D | null = null;
      let bestOffset = 0;

      for (const wall of activeFloor.walls) {
        const proj = projectPointOntoSegment(rawWorld, wall.start, wall.end);
        if (proj.distance < minDistance) {
          minDistance = proj.distance;
          nearestWall = wall;
          bestProj = proj.projection;
          const len = wallLength(wall);
          bestOffset = Math.round(proj.t * len);
        }
      }

      if (nearestWall && bestProj) {
        const isDoor = activeTool === 'door';
        const isVent = activeTool === 'ventilator';
        const settings = project.settings;
        const opWidth = isDoor
          ? (settings.defaultDoorWidth ?? feetInchesToSixteenths(3, 0))
          : isVent
          ? (settings.defaultVentilatorWidth ?? feetInchesToSixteenths(2, 0))
          : (settings.defaultWindowWidth ?? feetInchesToSixteenths(4, 0));
        const clampedOffset = Math.max(
          opWidth / 2,
          Math.min(wallLength(nearestWall) - opWidth / 2, bestOffset)
        );
        setHoverOpeningWall({ wall: nearestWall, offset: clampedOffset, projPoint: bestProj });
      } else {
        setHoverOpeningWall(null);
      }
      return;
    }

    if (dragMode === 'rotate' && dragRotateOrigin && dragRotateItemType) {
      const dx = rawWorld.x - dragRotateOrigin.x;
      const dy = rawWorld.y - dragRotateOrigin.y;
      let newAngle = Math.atan2(dy, dx);
      if (e.shiftKey) {
        const snap = Math.PI / 12; // 15 degree snapping
        newAngle = Math.round(newAngle / snap) * snap;
      }

      if (dragRotateItemType === 'furniture' && selectedFurnitureId && onUpdateFurniture) {
        const f = (activeFloor.furniture || []).find((it) => it.id === selectedFurnitureId);
        if (f) onUpdateFurniture({ ...f, rotation: newAngle });
      } else if (dragRotateItemType === 'column' && selectedColumnId && onUpdateColumn) {
        const c = (activeFloor.columns || []).find((it) => it.id === selectedColumnId);
        if (c) onUpdateColumn({ ...c, rotation: newAngle });
      } else if (dragRotateItemType === 'stair' && selectedStairId && onUpdateStaircase) {
        const s = (activeFloor.stairs || []).find((it) => it.id === selectedStairId);
        if (s) onUpdateStaircase({ ...s, angle: newAngle });
      } else if (dragRotateItemType === 'symbol' && selectedSymbolId && onUpdateSymbol) {
        const s = (activeFloor.symbols || []).find((it) => it.id === selectedSymbolId);
        if (s) onUpdateSymbol({ ...s, rotation: newAngle });
      } else if (dragRotateItemType === 'wall' && selectedWallId && onUpdateWall) {
        const w = activeFloor.walls.find((it) => it.id === selectedWallId);
        if (w) onUpdateWall(rotateWallAroundMidpoint(w, newAngle));
      }
      return;
    }

    if (dragMode === 'symbol' && selectedSymbolId && dragItemStartPos && dragMouseOrigin && onUpdateSymbol) {
      const sym = (activeFloor.symbols || []).find((s) => s.id === selectedSymbolId);
      if (sym) {
        const deltaX = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
        const deltaY = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);
        onUpdateSymbol({
          ...sym,
          position: { x: dragItemStartPos.x + deltaX, y: dragItemStartPos.y + deltaY },
        });
      }
      return;
    }

    if (dragMode === 'furniture' && selectedFurnitureId && dragItemStartPos && dragMouseOrigin && onUpdateFurniture) {
      const furn = (activeFloor.furniture || []).find((f) => f.id === selectedFurnitureId);
      if (furn) {
        const deltaX = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
        const deltaY = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);
        onUpdateFurniture({
          ...furn,
          position: { ...furn.position, x: dragItemStartPos.x + deltaX, y: dragItemStartPos.y + deltaY },
        });
      }
      return;
    }

    if (dragMode === 'column' && selectedColumnId && dragItemStartPos && dragMouseOrigin && onUpdateColumn) {
      const col = (activeFloor.columns || []).find((c) => c.id === selectedColumnId);
      if (col) {
        const deltaX = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
        const deltaY = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);
        onUpdateColumn({
          ...col,
          position: { x: dragItemStartPos.x + deltaX, y: dragItemStartPos.y + deltaY },
        });
      }
      return;
    }

    if (dragMode === 'stair' && selectedStairId && dragItemStartPos && dragMouseOrigin && onUpdateStaircase) {
      const stair = (activeFloor.stairs || []).find((s) => s.id === selectedStairId);
      if (stair) {
        const deltaX = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
        const deltaY = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);
        onUpdateStaircase({
          ...stair,
          startPoint: { x: dragItemStartPos.x + deltaX, y: dragItemStartPos.y + deltaY },
        });
      }
      return;
    }

    if (dragMode === 'junction' && dragJunctionOrigin && dragMouseOrigin && dragConnectedWalls.length > 0) {
      const deltaX = snapResult.point.x - dragMouseOrigin.x;
      const deltaY = snapResult.point.y - dragMouseOrigin.y;

      const updatedBatch: Wall[] = dragConnectedWalls.map((c) => {
        return {
          ...c.wall,
          start: c.isStart
            ? { x: c.origStart.x + deltaX, y: c.origStart.y + deltaY }
            : c.origStart,
          end: !c.isStart
            ? { x: c.origEnd.x + deltaX, y: c.origEnd.y + deltaY }
            : c.origEnd,
        };
      });

      if (onUpdateWallBatch) {
        onUpdateWallBatch(updatedBatch);
      } else {
        updatedBatch.forEach((w) => onUpdateWall(w));
      }
      return;
    }

    if (dragMode === 'wall' && selectedWallId && dragWallStartPos && dragMouseOrigin) {
      const selectedWall = activeFloor.walls.find((w) => w.id === selectedWallId);
      if (!selectedWall) return;

      const deltaX = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
      const deltaY = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);

      onUpdateWall({
        ...selectedWall,
        start: { x: dragWallStartPos.start.x + deltaX, y: dragWallStartPos.start.y + deltaY },
        end: { x: dragWallStartPos.end.x + deltaX, y: dragWallStartPos.end.y + deltaY },
      });
      return;
    }

    if (dragMode === 'opening' && selectedWallId && selectedOpeningId && onUpdateOpening) {
      const wall = activeFloor.walls.find((w) => w.id === selectedWallId);
      const op = wall?.openings.find((o) => o.id === selectedOpeningId);
      if (wall && op) {
        const proj = projectPointOntoSegment(rawWorld, wall.start, wall.end);
        const len = wallLength(wall);
        const newOffset = Math.max(op.width / 2, Math.min(len - op.width / 2, Math.round(proj.t * len)));
        onUpdateOpening(wall.id, { ...op, offsetAlongWall: newOffset });
      }
      return;
    }

    if (dragMode === 'section_p1' && dragSectionCutId && onUpdateSectionCut) {
      const cut = (activeFloor.sections || []).find((s) => s.id === dragSectionCutId);
      if (cut) {
        onUpdateSectionCut({ ...cut, p1: { x: snapResult.point.x, y: snapResult.point.y } });
      }
      return;
    }

    if (dragMode === 'section_p2' && dragSectionCutId && onUpdateSectionCut) {
      const cut = (activeFloor.sections || []).find((s) => s.id === dragSectionCutId);
      if (cut) {
        onUpdateSectionCut({ ...cut, p2: { x: snapResult.point.x, y: snapResult.point.y } });
      }
      return;
    }

    if (dragMode === 'section_body' && dragSectionCutId && dragSectionStart && dragMouseOrigin && onUpdateSectionCut) {
      const cut = (activeFloor.sections || []).find((s) => s.id === dragSectionCutId);
      if (cut) {
        const dx = snapSixteenths(rawWorld.x - dragMouseOrigin.x, snapGrid);
        const dy = snapSixteenths(rawWorld.y - dragMouseOrigin.y, snapGrid);
        onUpdateSectionCut({
          ...cut,
          p1: { x: dragSectionStart.p1.x + dx, y: dragSectionStart.p1.y + dy },
          p2: { x: dragSectionStart.p2.x + dx, y: dragSectionStart.p2.y + dy },
        });
      }
      return;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragMode('none');
    setDragJunctionOrigin(null);
    setDragConnectedWalls([]);
    setDragWallStartPos(null);
    setDragRotateOrigin(null);
    setDragRotateItemType(null);
    setDragMouseOrigin(null);
    setDragItemStartPos(null);
    setDragSectionCutId(null);
    setDragSectionStart(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      onZoomChange(Math.max(0.1, Math.min(10.0, zoom * zoomFactor)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wallStartPoint) setWallStartPoint(null);
    setHoverOpeningWall(null);
  };

  // Beginner Help Text for active tool
  const getToolHelp = () => {
    switch (activeTool) {
      case 'wall':
        return '✏️ Wall Tool: Click to start a wall, move mouse to stretch, and click to place. Hold Shift to lock 90°. Right-click or Esc to finish.';
      case 'door':
        return '🚪 Door Tool: Hover over any wall to position the door. Press F or Space to flip swing direction. Click to place.';
      case 'window':
        return '🪟 Window Tool: Hover over any wall to position the window, then click to place.';
      case 'ventilator':
        return '💨 Ventilator Tool: Hover over any wall to place a high-sill ventilator (6\'6" sill height). Standard for bathrooms & kitchens.';
      case 'furniture': {
        const activeCatItem =
          FURNITURE_CATALOG.find((c) => c.id === activeFurnitureCatalogId) ||
          FURNITURE_CATALOG[0];
        return `🛋️ Placing: ${activeCatItem.name} (${formatFeetInches(activeCatItem.defaultDimensions.width)} × ${formatFeetInches(activeCatItem.defaultDimensions.depth)}) — Click anywhere on plan to place.`;
      }
      case 'column':
        return '🏛️ Column Tool: Click anywhere to place a structural load-bearing column or pillar.';
      case 'stair':
        return '🪜 Stair Tool: Click to place a staircase. Use the Inspector to adjust width, treads, and rise.';
      case 'roof':
        return '🏠 Roof Tool: Configure and place gable, hip, or flat roofs over your floor plan.';
      case 'flooring':
        return '🏁 Flooring Studio: Click any enclosed room to customize its flooring (Tiles, Italian Marble, PVC/Vinyl, Matte Finishes).';
      case 'select':
        return '👆 Select Tool: Click on any wall, furniture, or door to customize it. Drag corners to resize rooms.';
      case 'pan':
        return '✋ Hand Tool: Click and drag to pan around your floor plan. Or use two-finger trackpad scroll.';
      case 'measure':
        return '📏 Measure Tool: Click and stretch between points to inspect exact clear distance in feet and inches.';
      case 'mep': {
        const item = MEP_CATALOG.find((c) => c.type === (activeSymbolType || 'light_point')) || MEP_CATALOG[0];
        return `⚡ MEP Tool: Placing ${item.name} (${item.symbolCode}) — Click to place • Press [R] to rotate • Keys [1-9] to switch fixture`;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        gridTemplateRows: '28px 1fr',
      }}
    >
      {/* Corner Origin Box */}
      <div
        style={{
          background: 'var(--ruler-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: 10,
          fontWeight: 700,
        }}
        title="Scale: Feet & Inches (1/16th inch internal)"
      >
        ft
      </div>

      {/* Top Ruler */}
      <canvas
        ref={rulerTopRef}
        style={{ width: '100%', height: 28, borderBottom: '1px solid var(--border-subtle)' }}
      />
      {/* Left Ruler */}
      <canvas
        ref={rulerLeftRef}
        style={{ width: 28, height: '100%', borderRight: '1px solid var(--border-subtle)' }}
      />

      {/* Main 2D CAD Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            onCursorMove(null);
            setActiveGuidelines([]);
            setHoverOpeningWall(null);
          }}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{
            width: '100%',
            height: '100%',
            cursor:
              isPanning || activeTool === 'pan'
                ? 'grabbing'
                : activeTool === 'wall'
                ? 'crosshair'
                : activeTool === 'door' || activeTool === 'window'
                ? 'copy'
                : activeTool === 'flooring'
                ? 'cell'
                : 'default',
          }}
        />

        {/* Contextual Drawing Tool Helper Bar (Only active when placing or drawing) */}
        {activeTool !== 'select' && activeTool !== 'pan' && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: '4px 14px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'var(--text-secondary)',
              zIndex: 30,
              whiteSpace: 'nowrap',
            }}
          >
            {activeTool === 'furniture' && (() => {
              const curCatItem = FURNITURE_CATALOG.find((c) => c.id === activeFurnitureCatalogId) || FURNITURE_CATALOG[0];
              return curCatItem?.imageUrl ? (
                <img
                  src={curCatItem.imageUrl}
                  alt={curCatItem.name}
                  style={{
                    width: 20,
                    height: 20,
                    objectFit: 'contain',
                    borderRadius: 3,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    padding: 1,
                  }}
                />
              ) : null;
            })()}
            <span>{getToolHelp()}</span>
            {(activeTool === 'furniture' || activeTool === 'stair' || activeTool === 'column' || activeTool === 'mep') && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                Press <kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>R</kbd> to rotate
              </span>
            )}
            {activeTool === 'furniture' && onOpenFurnitureCatalog && (
              <button
                onClick={onOpenFurnitureCatalog}
                style={{
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 7px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Catalog
              </button>
            )}
            {activeTool === 'flooring' && onOpenFlooringStudio && (
              <button
                onClick={() => onOpenFlooringStudio()}
                style={{
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Studio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
