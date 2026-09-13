import { describe, it, expect } from 'vitest';
import {
  createDefaultSitePlan,
  computeLotPolygon,
  computeSetbackPolygon,
  computeSiteAreaSqFt,
  computeBuildingFootprintSqFt,
  computeGroundCoveragePercentage,
  computeFloorAreaRatio,
  computeSolarPosition,
  OUTDOOR_CATALOG,
  OutdoorFeature,
} from './site';
import { createDefaultProject } from './defaults';
import {
  HistoryManager,
  UpdateSiteSettingsCommand,
  AddOutdoorFeatureCommand,
  UpdateOutdoorFeatureCommand,
  DeleteOutdoorFeatureCommand,
} from '../history';
import { SIXTEENTHS_PER_FOOT } from '../units';

describe('Phase 7 — Site Planning, Landscape Architecture & Solar Sun Study', () => {
  describe('Site & Zoning Boundary Calculations', () => {
    it('generates accurate 4-point survey property lot polygon', () => {
      const site = createDefaultSitePlan();
      const lotPoly = computeLotPolygon(site);

      expect(lotPoly.length).toBe(4);
      // 60' wide x 100' deep lot
      expect(site.lotWidth).toBe(60 * SIXTEENTHS_PER_FOOT);
      expect(site.lotDepth).toBe(100 * SIXTEENTHS_PER_FOOT);

      const areaSqFt = computeSiteAreaSqFt(site);
      expect(areaSqFt).toBe(6000); // 60 * 100 = 6,000 sq ft
    });

    it('computes zoning setback envelope dimensions correctly', () => {
      const site = createDefaultSitePlan();
      // Front: 15', Rear: 12', Left: 5', Right: 5'
      const setbackPoly = computeSetbackPolygon(site);

      expect(setbackPoly.length).toBe(4);
      const buildableWidthFt = (setbackPoly[1].x - setbackPoly[0].x) / SIXTEENTHS_PER_FOOT;
      const buildableDepthFt = (setbackPoly[2].y - setbackPoly[1].y) / SIXTEENTHS_PER_FOOT;

      // 60' - 5' - 5' = 50' buildable width
      expect(buildableWidthFt).toBeCloseTo(50, 1);
      // 100' - 15' - 12' = 73' buildable depth
      expect(buildableDepthFt).toBeCloseTo(73, 1);
    });

    it('calculates ground coverage percentage and FAR ratio', () => {
      const project = createDefaultProject();
      expect(project.site).toBeDefined();

      const footprintSqFt = computeBuildingFootprintSqFt(project);
      expect(footprintSqFt).toBeGreaterThan(0);

      const coveragePct = computeGroundCoveragePercentage(project, project.site!);
      expect(coveragePct).toBeGreaterThan(0);
      expect(coveragePct).toBeLessThan(100);

      const far = computeFloorAreaRatio(project, project.site!);
      expect(far).toBeGreaterThan(0);
    });
  });

  describe('Outdoor Catalog Specifications', () => {
    it('provides comprehensive presets for pools, hardscape, fencing, and trees', () => {
      const categories = new Set(OUTDOOR_CATALOG.map((c) => c.category));
      expect(categories.has('water')).toBe(true);
      expect(categories.has('hardscape')).toBe(true);
      expect(categories.has('barrier')).toBe(true);
      expect(categories.has('vegetation')).toBe(true);

      const pool = OUTDOOR_CATALOG.find((c) => c.type === 'pool');
      expect(pool).toBeDefined();
      expect(pool?.metadata?.poolDepthFt).toBeGreaterThanOrEqual(4);

      const deck = OUTDOOR_CATALOG.find((c) => c.type === 'deck');
      expect(deck).toBeDefined();

      const tree = OUTDOOR_CATALOG.find((c) => c.type === 'tree');
      expect(tree).toBeDefined();
      expect(tree?.metadata?.treeCanopyRadiusFt).toBeGreaterThan(0);
    });
  });

  describe('Astronomical Solar Sun Position Engine', () => {
    it('calculates sunrise, solar noon, sunset, and night lighting parameters', () => {
      // 12:00 PM Midday: sun should have high elevation and bright intensity
      const noon = computeSolarPosition(12.0, 0);
      expect(noon.isNight).toBe(false);
      expect(noon.elevationDeg).toBeGreaterThan(50);
      expect(noon.intensity).toBeGreaterThan(1.0);

      // 6:00 AM Dawn / 6:30 PM Sunset: golden hour
      const sunrise = computeSolarPosition(6.5, 0);
      expect(sunrise.isNight).toBe(false);
      expect(sunrise.elevationDeg).toBeLessThan(20);

      const sunset = computeSolarPosition(18.0, 0);
      expect(sunset.isNight).toBe(false);
      expect(sunset.elevationDeg).toBeLessThan(20);

      // 11:00 PM Night: sun below horizon, night flag true
      const night = computeSolarPosition(23.0, 0);
      expect(night.isNight).toBe(true);
      expect(night.elevationDeg).toBeLessThan(0);
      expect(night.intensity).toBeLessThan(0.3);
    });

    it('adjusts solar azimuth based on North orientation degrees', () => {
      const posNorth0 = computeSolarPosition(12.0, 0);
      const posNorth90 = computeSolarPosition(12.0, 90);

      expect((posNorth90.azimuthDeg - posNorth0.azimuthDeg + 360) % 360).toBeCloseTo(90, 1);
    });
  });

  describe('Site History Commands and Undo/Redo', () => {
    it('executes and undos site settings updates', () => {
      const project = createDefaultProject();
      const history = new HistoryManager(project);

      const cmd = new UpdateSiteSettingsCommand({
        lotWidth: 80 * SIXTEENTHS_PER_FOOT,
        lotDepth: 120 * SIXTEENTHS_PER_FOOT,
        frontSetback: 20 * SIXTEENTHS_PER_FOOT,
      });

      history.execute(cmd);
      let p = history.getProject();
      expect(p.site?.lotWidth).toBe(80 * SIXTEENTHS_PER_FOOT);
      expect(p.site?.frontSetback).toBe(20 * SIXTEENTHS_PER_FOOT);

      history.undo();
      p = history.getProject();
      expect(p.site?.lotWidth).toBe(60 * SIXTEENTHS_PER_FOOT);
    });

    it('adds, updates, and deletes outdoor features with undo/redo', () => {
      const project = createDefaultProject();
      const history = new HistoryManager(project);

      const newPool: OutdoorFeature = {
        id: 'feat_test_lap_pool',
        type: 'pool',
        name: 'Olympic Lap Pool',
        position: { x: 0, y: 3000 },
        width: 10 * SIXTEENTHS_PER_FOOT,
        depth: 40 * SIXTEENTHS_PER_FOOT,
        metadata: { poolDepthFt: 5 },
      };

      // 1. Add feature
      history.execute(new AddOutdoorFeatureCommand(newPool));
      let p = history.getProject();
      expect(p.site?.features.some((f) => f.id === newPool.id)).toBe(true);

      // 2. Update feature
      history.execute(
        new UpdateOutdoorFeatureCommand({
          ...newPool,
          name: 'Renovated Olympic Lap Pool',
          depth: 50 * SIXTEENTHS_PER_FOOT,
        })
      );
      p = history.getProject();
      const updated = p.site?.features.find((f) => f.id === newPool.id);
      expect(updated?.name).toBe('Renovated Olympic Lap Pool');
      expect(updated?.depth).toBe(50 * SIXTEENTHS_PER_FOOT);

      // 3. Delete feature
      history.execute(new DeleteOutdoorFeatureCommand(newPool.id));
      p = history.getProject();
      expect(p.site?.features.some((f) => f.id === newPool.id)).toBe(false);

      // Undo deletion
      history.undo();
      p = history.getProject();
      expect(p.site?.features.some((f) => f.id === newPool.id)).toBe(true);
    });
  });
});
