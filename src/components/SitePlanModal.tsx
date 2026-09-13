import React, { useState, useMemo } from 'react';
import { Project } from '../core/model/types';
import {
  SitePlan,
  OutdoorFeature,
  OUTDOOR_CATALOG,
  OutdoorCatalogItem,
  computeSiteAreaSqFt,
  computeBuildingFootprintSqFt,
  computeTotalBuiltUpAreaSqFt,
  computeGroundCoveragePercentage,
  computeFloorAreaRatio,
  computeSolarPosition,
} from '../core/model/site';
import { FeetInchesInput } from './FeetInchesInput';
import { Sixteenths, SIXTEENTHS_PER_FOOT } from '../core/units';
import {
  X,
  Compass,
  Sun,
  Moon,
  Trees,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Sparkles,
  Sliders,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface SitePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateSiteSettings: (updates: Partial<SitePlan>) => void;
  onAddOutdoorFeature: (feature: OutdoorFeature) => void;
  onDeleteOutdoorFeature: (featureId: string) => void;
  onUpdateTimeOfDay?: (hours: number) => void;
}

export type OutdoorTab = 'all' | 'water' | 'hardscape' | 'vegetation' | 'barrier';

export const SitePlanModal: React.FC<SitePlanModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateSiteSettings,
  onAddOutdoorFeature,
  onDeleteOutdoorFeature,
  onUpdateTimeOfDay,
}) => {
  const site = project.site;
  const [activeTab, setActiveTab] = useState<'zoning' | 'catalog' | 'elements' | 'solar'>('catalog');
  const [catalogCategory, setCatalogCategory] = useState<OutdoorTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Local solar time slider state
  const [sunTime, setSunTime] = useState<number>(project.settings.sunTimeHours ?? 14.5);

  if (!isOpen || !site) return null;

  // Site statistics
  const lotSqFt = computeSiteAreaSqFt(site);
  const footprintSqFt = computeBuildingFootprintSqFt(project);
  const totalBuiltUpSqFt = computeTotalBuiltUpAreaSqFt(project);
  const groundCoveragePct = computeGroundCoveragePercentage(project, site);
  const far = computeFloorAreaRatio(project, site);
  const netOutdoorSqFt = Math.max(0, lotSqFt - footprintSqFt);

  const isCoverageCompliant = groundCoveragePct <= (site.maxAllowedGroundCoveragePct ?? 50);
  const isFarCompliant = far <= (site.maxAllowedFAR ?? 1.5);

  // Filtered catalog
  const filteredCatalog = OUTDOOR_CATALOG.filter((item) => {
    const matchesCat = catalogCategory === 'all' || item.category === catalogCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Astronomical solar parameters
  const solar = computeSolarPosition(sunTime, site.northOrientationDegrees);

  // Time formatter
  const formatHourString = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${period}`;
  };

  const handleAddFeatureFromCatalog = (item: OutdoorCatalogItem) => {
    // Generate placement position within yard
    const offsetIndex = site.features.length;
    const posX = ((offsetIndex % 3) - 1) * 16 * SIXTEENTHS_PER_FOOT;
    const posY = (Math.floor(offsetIndex / 3) * 14 - 18) * SIXTEENTHS_PER_FOOT;

    const newFeature: OutdoorFeature = {
      id: `feat_${item.type}_${Date.now()}`,
      type: item.type,
      name: item.name,
      position: { x: posX, y: posY },
      width: item.defaultWidthFt * SIXTEENTHS_PER_FOOT,
      depth: item.defaultDepthFt * SIXTEENTHS_PER_FOOT,
      height: item.defaultHeightFt ? item.defaultHeightFt * SIXTEENTHS_PER_FOOT : 16,
      rotation: 0,
      metadata: { ...item.metadata, color: item.color },
    };

    onAddOutdoorFeature(newFeature);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1140,
          height: '90vh',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-medium)',
            background: 'var(--bg-toolbar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Trees size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Site Planning & Landscape Studio
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    letterSpacing: 0.5,
                  }}
                >
                  Phase 7 Pro
                </span>
              </div>
              <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--text-secondary)' }}>
                Lot Boundaries • Zoning Setbacks • Swimming Pools • Patio Decks • Driveways • Solar Shadows
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: 3,
              borderRadius: 10,
              border: '1px solid var(--border-medium)',
              gap: 4,
            }}
          >
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'catalog' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'catalog' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              🏊 Outdoor Catalog
            </button>
            <button
              onClick={() => setActiveTab('zoning')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'zoning' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'zoning' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              📐 Lot & Setbacks
            </button>
            <button
              onClick={() => setActiveTab('solar')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'solar' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'solar' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              ☀️ Solar & Day/Night
            </button>
            <button
              onClick={() => setActiveTab('elements')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'elements' ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === 'elements' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              🌳 Site Elements ({site.features.length})
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* TAB 1: OUTDOOR CATALOG */}
          {activeTab === 'catalog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Category Filters */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(
                    [
                      { id: 'all', label: 'All Elements' },
                      { id: 'water', label: '🏊 Swimming Pools' },
                      { id: 'hardscape', label: '🪵 Decks & Patios' },
                      { id: 'barrier', label: '🧱 Walls & Fences' },
                      { id: 'vegetation', label: '🌲 Trees & Shrubs' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCatalogCategory(c.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: catalogCategory === c.id ? 'var(--accent-blue)' : 'var(--border-medium)',
                        background: catalogCategory === c.id ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-input)',
                        color: catalogCategory === c.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    width: 220,
                  }}
                />
              </div>

              {/* Catalog Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border-medium)',
                      borderRadius: 12,
                      background: 'var(--bg-surface)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Visual Color Banner */}
                    <div
                      style={{
                        height: 90,
                        background: `linear-gradient(135deg, ${item.color}33 0%, ${item.color}99 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          backgroundColor: item.color,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: 20,
                        }}
                      >
                        {item.type === 'pool'
                          ? '🏊'
                          : item.type === 'deck'
                          ? '🪵'
                          : item.type === 'patio'
                          ? '🪨'
                          : item.type === 'driveway'
                          ? '🚗'
                          : item.type === 'tree'
                          ? '🌳'
                          : item.type === 'fence'
                          ? '🧱'
                          : '🌿'}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(0, 0, 0, 0.45)',
                          color: '#ffffff',
                        }}
                      >
                        {item.defaultWidthFt}′ × {item.defaultDepthFt}′
                      </span>
                    </div>

                    {/* Information */}
                    <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.name}
                      </h4>
                      <p
                        style={{
                          margin: '0 0 12px',
                          fontSize: 11.5,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45,
                          flex: 1,
                        }}
                      >
                        {item.description}
                      </p>

                      <button
                        onClick={() => handleAddFeatureFromCatalog(item)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'var(--accent-blue)',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        <Plus size={14} /> Add to Property Site
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LOT & ZONING SETBACKS */}
          {activeTab === 'zoning' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              {/* Left Column: Dimensions & Setback Inputs */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <Compass size={18} color="var(--accent-blue)" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Property Survey Boundaries & Setbacks
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Lot Width (Street Frontage)
                    </label>
                    <FeetInchesInput
                      value={site.lotWidth}
                      onChange={(w) => onUpdateSiteSettings({ lotWidth: w })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Lot Depth
                    </label>
                    <FeetInchesInput
                      value={site.lotDepth}
                      onChange={(d) => onUpdateSiteSettings({ lotDepth: d })}
                    />
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Municipal Zoning Clearance Setbacks
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Front Setback (Road Easement)
                    </label>
                    <FeetInchesInput
                      value={site.frontSetback}
                      onChange={(v) => onUpdateSiteSettings({ frontSetback: v })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Rear Yard Setback
                    </label>
                    <FeetInchesInput
                      value={site.rearSetback}
                      onChange={(v) => onUpdateSiteSettings({ rearSetback: v })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Left Side Yard Setback
                    </label>
                    <FeetInchesInput
                      value={site.sideSetbackLeft}
                      onChange={(v) => onUpdateSiteSettings({ sideSetbackLeft: v })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Right Side Yard Setback
                    </label>
                    <FeetInchesInput
                      value={site.sideSetbackRight}
                      onChange={(v) => onUpdateSiteSettings({ sideSetbackRight: v })}
                    />
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                {/* Compass North Orientation Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Compass True North Orientation
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {site.northOrientationDegrees}° (
                      {site.northOrientationDegrees === 0
                        ? 'Due North'
                        : site.northOrientationDegrees === 90
                        ? 'East'
                        : site.northOrientationDegrees === 180
                        ? 'South'
                        : site.northOrientationDegrees === 270
                        ? 'West'
                        : `${site.northOrientationDegrees}°`}
                      )
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={site.northOrientationDegrees}
                    onChange={(e) => onUpdateSiteSettings({ northOrientationDegrees: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
                  />
                </div>
              </div>

              {/* Right Column: Zoning Statistics & FAR Compliance */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Site Coverage & FAR Compliance
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Lot Area</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      {lotSqFt.toLocaleString()} sq ft
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Net Outdoor Yard</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                      {netOutdoorSqFt.toLocaleString()} sq ft
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Ground Footprint</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      {footprintSqFt.toLocaleString()} sq ft
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Built-Up Area</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      {totalBuiltUpSqFt.toLocaleString()} sq ft
                    </div>
                  </div>
                </div>

                {/* Ground Coverage Ratio Gauge */}
                <div style={{ background: 'var(--bg-input)', padding: 14, borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Ground Coverage Ratio
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isCoverageCompliant ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isCoverageCompliant ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {groundCoveragePct}% (Max Allowed: {site.maxAllowedGroundCoveragePct ?? 50}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 7, borderRadius: 4, background: 'var(--border-medium)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, groundCoveragePct)}%`,
                        height: '100%',
                        backgroundColor: isCoverageCompliant ? '#10b981' : '#ef4444',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                {/* Floor Area Ratio (FAR) Gauge */}
                <div style={{ background: 'var(--bg-input)', padding: 14, borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Floor Area Ratio (FAR)
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isFarCompliant ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isFarCompliant ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {far} (Bylaw Limit: {site.maxAllowedFAR ?? 1.5})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 7, borderRadius: 4, background: 'var(--border-medium)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (far / (site.maxAllowedFAR ?? 1.5)) * 100)}%`,
                        height: '100%',
                        backgroundColor: isFarCompliant ? '#10b981' : '#ef4444',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASTRONOMICAL SOLAR SUN STUDY */}
          {activeTab === 'solar' && (
            <div
              style={{
                maxWidth: 800,
                margin: '0 auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {solar.isNight ? <Moon size={22} color="#94a3b8" /> : <Sun size={22} color="#f59e0b" />}
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Astronomical Day / Night Solar Shadow Simulation
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Simulate solar shadow trajectories, twilight golden hours, and exterior nighttime lighting.
                  </p>
                </div>
              </div>

              {/* Solar Time Slider */}
              <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Time of Day (Solar Clock)
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: solar.isNight ? '#38bdf8' : '#f59e0b',
                      padding: '4px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {formatHourString(sunTime)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.25"
                  value={sunTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setSunTime(t);
                    if (onUpdateTimeOfDay) onUpdateTimeOfDay(t);
                  }}
                  style={{ width: '100%', accentColor: solar.isNight ? '#38bdf8' : '#f59e0b' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>🌙 12 AM</span>
                  <span>🌅 6 AM Sunrise</span>
                  <span>☀️ 12 PM Noon</span>
                  <span>🌇 6:30 PM Sunset</span>
                  <span>🌙 11 PM Night</span>
                </div>
              </div>

              {/* Astronomical Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Sun Altitude / Elevation</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {Math.round(solar.elevationDeg)}°
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Solar Azimuth</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {Math.round(solar.azimuthDeg)}°
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Atmosphere Color</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: solar.skyColor, border: '1px solid #ffffff' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{solar.skyColor}</span>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Lighting State</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: solar.isNight ? '#38bdf8' : '#f59e0b', marginTop: 4 }}>
                    {solar.isNight ? '🌙 Night Luminescence' : sunTime < 7.5 || sunTime > 17.5 ? '🌇 Golden Hour' : '☀️ Direct Daylight'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURRENT SITE ELEMENTS */}
          {activeTab === 'elements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Installed Outdoor Living Features ({site.features.length})
                </span>
                <button
                  onClick={() => setActiveTab('catalog')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={14} /> Add from Catalog
                </button>
              </div>

              {site.features.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    borderRadius: 12,
                    border: '1px dashed var(--border-medium)',
                  }}
                >
                  <Trees size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>No Outdoor Features Installed</h4>
                  <p style={{ margin: '4px 0 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Add swimming pools, timber decks, patio dining, driveways, or garden trees from the catalog.
                  </p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent-blue)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Browse Outdoor Catalog
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {site.features.map((feat) => (
                    <div
                      key={feat.id}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{feat.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Type: <span style={{ textTransform: 'capitalize' }}>{feat.type}</span> • Size:{' '}
                          {Math.round(feat.width / SIXTEENTHS_PER_FOOT)}′ × {Math.round(feat.depth / SIXTEENTHS_PER_FOOT)}′
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteOutdoorFeature(feat.id)}
                        title="Remove Outdoor Feature"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none',
                          padding: 8,
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-medium)',
            background: 'var(--bg-toolbar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Property Lot: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(site.lotWidth / SIXTEENTHS_PER_FOOT)}′ × {Math.round(site.lotDepth / SIXTEENTHS_PER_FOOT)}′</strong> ({lotSqFt.toLocaleString()} sq ft) • {site.features.length} Outdoor Features
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
