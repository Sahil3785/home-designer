import { describe, it, expect } from 'vitest';
import {
  getPointVastuSector,
  auditRoomVastu,
  generateVastuReport,
  computeCentroid,
  computeFloorBoundingBox,
  VASTU_SECTOR_DEFS,
} from './vastu';
import { Room } from './types';
import { createDefaultProject } from './defaults';

describe('Vastu Shastra & Spatial Harmony Compliance Engine', () => {
  const bbox = {
    minX: -1000,
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
    centerX: 0,
    centerY: 0,
    width: 2000,
    height: 2000,
  };

  it('correctly maps 9 directional sectors without rotation', () => {
    // Center / Brahmasthan
    expect(getPointVastuSector({ x: 0, y: 0 }, bbox, 0)).toBe('Center');

    // North (Top)
    expect(getPointVastuSector({ x: 0, y: -700 }, bbox, 0)).toBe('N');

    // North-East (Top-Right)
    expect(getPointVastuSector({ x: 700, y: -700 }, bbox, 0)).toBe('NE');

    // South-East (Bottom-Right / Agni)
    expect(getPointVastuSector({ x: 700, y: 700 }, bbox, 0)).toBe('SE');

    // South-West (Bottom-Left / Nairutya)
    expect(getPointVastuSector({ x: -700, y: 700 }, bbox, 0)).toBe('SW');

    // North-West (Top-Left / Vayu)
    expect(getPointVastuSector({ x: -700, y: -700 }, bbox, 0)).toBe('NW');
  });

  it('audits kitchen placement according to Agni (SE) fire zone rules', () => {
    const kitchenRoom: Room = {
      id: 'r_kitchen',
      floorId: 'floor_0',
      name: 'Modular Kitchen',
      polygon: [{ x: 500, y: 500 }, { x: 900, y: 500 }, { x: 900, y: 900 }, { x: 500, y: 900 }],
      wallIds: [],
    };

    // SE is auspicious (100 score)
    const seAudit = auditRoomVastu(kitchenRoom, 'SE');
    expect(seAudit.status).toBe('auspicious');
    expect(seAudit.score).toBe(100);

    // NE is inauspicious for kitchen (water clash)
    const neAudit = auditRoomVastu(kitchenRoom, 'NE');
    expect(neAudit.status).toBe('inauspicious');
    expect(neAudit.score).toBeLessThan(50);
    expect(neAudit.remedy).toBeDefined();
  });

  it('audits Master Bedroom placement according to Nairutya (SW) earth zone rules', () => {
    const masterBed: Room = {
      id: 'r_master',
      floorId: 'floor_0',
      name: 'Master Suite Bedroom',
      polygon: [{ x: -900, y: 500 }, { x: -500, y: 500 }, { x: -500, y: 900 }, { x: -900, y: 900 }],
      wallIds: [],
    };

    // SW is auspicious (100 score)
    const swAudit = auditRoomVastu(masterBed, 'SW');
    expect(swAudit.status).toBe('auspicious');
    expect(swAudit.score).toBe(100);

    // NE is inauspicious for Master Bedroom
    const neAudit = auditRoomVastu(masterBed, 'NE');
    expect(neAudit.status).toBe('inauspicious');
    expect(neAudit.score).toBeLessThan(50);
  });

  it('generates a full project Vastu harmony report with ratings and remedies', () => {
    const project = createDefaultProject();
    const report = generateVastuReport(project);

    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(['Excellent', 'Good', 'Fair', 'Needs Remedies']).toContain(report.rating);
    expect(report.generalRemedies.length).toBeGreaterThan(0);
  });

  it('computes correct polygon centroids', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const centroid = computeCentroid(poly);
    expect(centroid.x).toBe(50);
    expect(centroid.y).toBe(50);
  });
});
