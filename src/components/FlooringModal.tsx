import React, { useState, useMemo } from 'react';
import { Project, Room, MaterialDef, FlooringConfig } from '../core/model/types';
import { DEFAULT_MATERIALS } from '../core/model/defaults';
import {
  X,
  Search,
  Check,
  Sparkles,
  Layers,
  Grid,
  CheckCircle2,
  DollarSign,
  Info,
  Maximize2,
  Sliders,
} from 'lucide-react';

interface FlooringModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedRoomId?: string | null;
  targetRoomId?: string | null;
  onApplyRoomFlooring: (floorId: string, roomId: string, materialId: string, config?: FlooringConfig) => void;
  onApplyFloorFlooringBatch: (floorId: string, materialId: string, config?: FlooringConfig) => void;
}

export type FlooringCategoryTab = 'all' | 'tile' | 'marble' | 'pvc' | 'concrete' | 'wood';

interface FlooringPreset {
  id: string;
  name: string;
  category: FlooringCategoryTab;
  categoryLabel: string;
  color: string;
  defaultTileSize: number; // inches
  defaultPattern: 'grid' | 'staggered' | 'herringbone';
  sheen: 'matte' | 'satin' | 'glossy';
  costPerSqFt: number;
  description: string;
  thicknessMm: number;
}

export const FLOORING_PRESETS: FlooringPreset[] = [
  // 1. TILES & CERAMICS
  {
    id: 'mat_tile_vitrified_large',
    name: '24"×48" Vitrified Italian Floor Tile',
    category: 'tile',
    categoryLabel: 'Tiles & Ceramics',
    color: '#E5E5E2',
    defaultTileSize: 24,
    defaultPattern: 'staggered',
    sheen: 'glossy',
    costPerSqFt: 6.5,
    description: 'Large-format polished vitrified tile with nano-seal stain resistance.',
    thicknessMm: 9.5,
  },
  {
    id: 'mat_ceramic_tile',
    name: '24"×24" Porcelain Grey Tile',
    category: 'tile',
    categoryLabel: 'Tiles & Ceramics',
    color: '#C7CBD1',
    defaultTileSize: 24,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 4.8,
    description: 'Industrial matte grey porcelain tile with rectified edges.',
    thicknessMm: 8.5,
  },
  {
    id: 'mat_tile_moroccan_encaustic',
    name: 'Moroccan Geometric Encaustic Tile',
    category: 'tile',
    categoryLabel: 'Tiles & Ceramics',
    color: '#3B586B',
    defaultTileSize: 12,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 8.2,
    description: 'Handcrafted Moroccan encaustic patterned tile for vibrant feature floors.',
    thicknessMm: 12.0,
  },
  {
    id: 'mat_tile_hex_mosaic',
    name: 'Satin Hexagonal Mosaic Floor Tile',
    category: 'tile',
    categoryLabel: 'Tiles & Ceramics',
    color: '#F4F4F5',
    defaultTileSize: 12,
    defaultPattern: 'grid',
    sheen: 'satin',
    costPerSqFt: 7.0,
    description: 'Modern white hexagonal tile with slip-resistant satin surface.',
    thicknessMm: 7.0,
  },
  {
    id: 'mat_tile_slate_black',
    name: 'Natural Riven Black Slate Floor Tile',
    category: 'tile',
    categoryLabel: 'Tiles & Ceramics',
    color: '#1E2126',
    defaultTileSize: 24,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 7.8,
    description: 'Deep textured charcoal natural slate with cleft finish.',
    thicknessMm: 10.0,
  },

  // 2. MARBLE & LUXURY STONE
  {
    id: 'mat_marble_carrara',
    name: 'Classic Italian Carrara White Marble',
    category: 'marble',
    categoryLabel: 'Italian Marble',
    color: '#E8E7E3',
    defaultTileSize: 36,
    defaultPattern: 'grid',
    sheen: 'glossy',
    costPerSqFt: 14.5,
    description: 'Pristine white marble quarried in Tuscany with soft feathered grey veins.',
    thicknessMm: 18.0,
  },
  {
    id: 'mat_marble_calacatta',
    name: 'Calacatta Gold White Luxury Marble',
    category: 'marble',
    categoryLabel: 'Italian Marble',
    color: '#ECEEED',
    defaultTileSize: 36,
    defaultPattern: 'grid',
    sheen: 'glossy',
    costPerSqFt: 18.0,
    description: 'Bold dramatic taupe and golden amber veining on pure white crystalline field.',
    thicknessMm: 20.0,
  },
  {
    id: 'mat_marble_marquina',
    name: 'Nero Marquina Black Spanish Marble',
    category: 'marble',
    categoryLabel: 'Italian Marble',
    color: '#1A1C1E',
    defaultTileSize: 24,
    defaultPattern: 'grid',
    sheen: 'glossy',
    costPerSqFt: 15.0,
    description: 'High-contrast midnight black marble with striking white lightning veins.',
    thicknessMm: 18.0,
  },
  {
    id: 'mat_marble_crema_marfil',
    name: 'Spanish Crema Marfil Beige Marble',
    category: 'marble',
    categoryLabel: 'Italian Marble',
    color: '#DFD5C4',
    defaultTileSize: 24,
    defaultPattern: 'grid',
    sheen: 'glossy',
    costPerSqFt: 11.5,
    description: 'Warm cream limestone marble with subtle cinnamon calcite streaks.',
    thicknessMm: 16.0,
  },
  {
    id: 'mat_marble_emerald',
    name: 'Rainforest Emerald Exotic Marble',
    category: 'marble',
    categoryLabel: 'Italian Marble',
    color: '#2B4A3E',
    defaultTileSize: 24,
    defaultPattern: 'grid',
    sheen: 'glossy',
    costPerSqFt: 22.0,
    description: 'Exotic deep green serpentine marble with intricate brown tree-root veins.',
    thicknessMm: 18.0,
  },

  // 3. PVC & LUXURY VINYL
  {
    id: 'mat_pvc_lvt_plank',
    name: 'LVT Luxury Vinyl Plank (Weathered Oak)',
    category: 'pvc',
    categoryLabel: 'PVC & Vinyl',
    color: '#8A7B6E',
    defaultTileSize: 48,
    defaultPattern: 'staggered',
    sheen: 'matte',
    costPerSqFt: 3.8,
    description: '20-mil commercial wear-layer LVT with registered-in-embossed wood grain.',
    thicknessMm: 5.0,
  },
  {
    id: 'mat_pvc_spc_honey',
    name: 'Waterproof Rigid Core SPC Vinyl (Honey Oak)',
    category: 'pvc',
    categoryLabel: 'PVC & Vinyl',
    color: '#C1935B',
    defaultTileSize: 48,
    defaultPattern: 'staggered',
    sheen: 'matte',
    costPerSqFt: 4.2,
    description: 'Stone plastic composite rigid core flooring with attached acoustic pad.',
    thicknessMm: 6.5,
  },
  {
    id: 'mat_pvc_slate_tile',
    name: 'Architectural Slate Grey PVC Tile',
    category: 'pvc',
    categoryLabel: 'PVC & Vinyl',
    color: '#475569',
    defaultTileSize: 18,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 3.5,
    description: 'Commercial interlocking modular PVC tile resistant to water and heavy traffic.',
    thicknessMm: 4.5,
  },
  {
    id: 'mat_pvc_seamless_sheet',
    name: 'Resilient Seamless Architectural PVC Sheet',
    category: 'pvc',
    categoryLabel: 'PVC & Vinyl',
    color: '#D4CDC2',
    defaultTileSize: 72,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 3.2,
    description: 'Hygienic welded-seam homogeneous vinyl sheet for kitchens and clinics.',
    thicknessMm: 2.5,
  },

  // 4. MATTE & CONCRETE / MATTING
  {
    id: 'mat_concrete_microcement',
    name: 'Architectural Matte Microcement (Raw Grey)',
    category: 'concrete',
    categoryLabel: 'Matte & Concrete',
    color: '#A6ABB0',
    defaultTileSize: 96,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 9.0,
    description: 'Ultra-matte continuous microcement with organic trowel variation and zero glare.',
    thicknessMm: 3.0,
  },
  {
    id: 'mat_matte_nordic_oak',
    name: 'Ultra-Matte Nordic Oak (5% Zero-Glare)',
    category: 'wood',
    categoryLabel: 'Matte & Hardwood',
    color: '#CAB79C',
    defaultTileSize: 48,
    defaultPattern: 'staggered',
    sheen: 'matte',
    costPerSqFt: 9.8,
    description: 'Bespoke European oak with dead-matte invisible oil finish preserving raw wood feel.',
    thicknessMm: 15.0,
  },
  {
    id: 'mat_epoxy_matte_white',
    name: 'Seamless Studio Matte White Epoxy Resin',
    category: 'concrete',
    categoryLabel: 'Matte & Concrete',
    color: '#F8F9FA',
    defaultTileSize: 96,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 8.5,
    description: 'Self-leveling architectural polyurethane epoxy with soft velvety matte topcoat.',
    thicknessMm: 3.5,
  },
  {
    id: 'mat_carpet_acoustic_matting',
    name: 'Acoustic Natural Wool & Jute Floor Matting',
    category: 'concrete',
    categoryLabel: 'Matte & Carpet Mat',
    color: '#BDB19C',
    defaultTileSize: 36,
    defaultPattern: 'grid',
    sheen: 'matte',
    costPerSqFt: 5.5,
    description: 'Heavy-duty ribbed natural fiber acoustic floor matting with rubber backing.',
    thicknessMm: 8.0,
  },
  {
    id: 'mat_oak_hardwood',
    name: 'European White Oak Parquet',
    category: 'wood',
    categoryLabel: 'Hardwood Parquet',
    color: '#B58852',
    defaultTileSize: 36,
    defaultPattern: 'staggered',
    sheen: 'satin',
    costPerSqFt: 10.5,
    description: 'Classic tongue-and-groove engineered white oak with satin UV lacquer.',
    thicknessMm: 14.0,
  },
  {
    id: 'mat_walnut_wood',
    name: 'American Walnut Plank',
    category: 'wood',
    categoryLabel: 'Hardwood Parquet',
    color: '#4A3425',
    defaultTileSize: 48,
    defaultPattern: 'staggered',
    sheen: 'satin',
    costPerSqFt: 12.8,
    description: 'Luxurious dark chocolate walnut hardwood with natural amber sapwood swirls.',
    thicknessMm: 15.0,
  },
];

export const FlooringModal: React.FC<FlooringModalProps> = ({
  isOpen,
  onClose,
  project,
  selectedRoomId,
  targetRoomId,
  onApplyRoomFlooring,
  onApplyFloorFlooringBatch,
}) => {
  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const rooms = activeFloor.rooms || [];

  // Active target: room ID or '__all__'
  const effectiveRoomId = targetRoomId || selectedRoomId;
  const [targetScope, setTargetScope] = useState<string>(
    effectiveRoomId || (rooms.length > 0 ? rooms[0].id : '__all__')
  );

  const [activeCategory, setActiveCategory] = useState<FlooringCategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mat_tile_vitrified_large');

  // Customization parameters
  const [tileSizeInches, setTileSizeInches] = useState<number>(24);
  const [tilePattern, setTilePattern] = useState<'grid' | 'staggered' | 'herringbone'>('grid');
  const [finishSheen, setFinishSheen] = useState<'matte' | 'satin' | 'glossy'>('glossy');
  const [groutColor, setGroutColor] = useState<string>('#cbd5e1');

  // Sync preset defaults when a preset card is clicked
  const handleSelectPreset = (preset: FlooringPreset) => {
    setSelectedPresetId(preset.id);
    setTileSizeInches(preset.defaultTileSize);
    setTilePattern(preset.defaultPattern);
    setFinishSheen(preset.sheen);
  };

  const selectedPreset = FLOORING_PRESETS.find((p) => p.id === selectedPresetId) || FLOORING_PRESETS[0];

  // Filter presets
  const filteredPresets = useMemo(() => {
    return FLOORING_PRESETS.filter((p) => {
      const matchesCat =
        activeCategory === 'all' ||
        (activeCategory === 'tile' && p.category === 'tile') ||
        (activeCategory === 'marble' && p.category === 'marble') ||
        (activeCategory === 'pvc' && p.category === 'pvc') ||
        (activeCategory === 'concrete' && p.category === 'concrete') ||
        (activeCategory === 'wood' && p.category === 'wood');

      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Target area calculation
  const targetAreaSqFt = useMemo(() => {
    if (targetScope === '__all__') {
      if (rooms.length > 0) {
        return rooms.reduce((sum, r) => sum + (r.computedAreaSqFt || 0), 0);
      }
      if (activeFloor.walls && activeFloor.walls.length >= 3) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const w of activeFloor.walls) {
          minX = Math.min(minX, w.start.x, w.end.x);
          maxX = Math.max(maxX, w.start.x, w.end.x);
          minY = Math.min(minY, w.start.y, w.end.y);
          maxY = Math.max(maxY, w.start.y, w.end.y);
        }
        return Math.max(10, Math.round(((maxX - minX) * (maxY - minY)) / (192 * 192)));
      }
      return 0;
    }
    const rm = rooms.find((r) => r.id === targetScope);
    if (rm) return rm.computedAreaSqFt || 0;
    if (activeFloor.walls && activeFloor.walls.length >= 3) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const w of activeFloor.walls) {
        minX = Math.min(minX, w.start.x, w.end.x);
        maxX = Math.max(maxX, w.start.x, w.end.x);
        minY = Math.min(minY, w.start.y, w.end.y);
        maxY = Math.max(maxY, w.start.y, w.end.y);
      }
      return Math.max(10, Math.round(((maxX - minX) * (maxY - minY)) / (192 * 192)));
    }
    return 0;
  }, [rooms, targetScope, activeFloor.walls]);

  const targetRoomName = useMemo(() => {
    if (targetScope === '__all__') return `Entire Floor (${activeFloor.name})`;
    const rm = rooms.find((r) => r.id === targetScope);
    return rm ? rm.name : 'Main Room';
  }, [rooms, targetScope, activeFloor.name]);

  // Cost and material calculation
  const estimatedCost = Math.round(targetAreaSqFt * selectedPreset.costPerSqFt);
  const areaWithWaste = Math.round(targetAreaSqFt * 1.1); // 10% cutting allowance
  const approxTileCount = Math.round(areaWithWaste / Math.max(1, (tileSizeInches * tileSizeInches) / 144));

  // Apply Action
  const handleApply = () => {
    const config: FlooringConfig = {
      tileSizeInches,
      tilePattern,
      finishSheen,
      groutColor,
    };

    if (targetScope === '__all__') {
      onApplyFloorFlooringBatch(activeFloor.id, selectedPreset.id, config);
    } else {
      onApplyRoomFlooring(activeFloor.id, targetScope, selectedPreset.id, config);
    }
    onClose();
  };

  if (!isOpen) return null;

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
          maxWidth: 1180,
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
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Grid size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Architectural Flooring Studio
              </h2>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                Select & Install Tiles, Italian Marble, Waterproof PVC/Vinyl, and Matte Finishes
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Sub-Header: Scope Selector & Search */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Target Room Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Install Flooring On:
            </span>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <optgroup label="Single Rooms">
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    🚪 {r.name} ({r.computedAreaSqFt || 0} sq ft)
                  </option>
                ))}
                {rooms.length === 0 && (
                  <option value="__all__">
                    🚪 Enclosed Room ({targetAreaSqFt} sq ft)
                  </option>
                )}
              </optgroup>
              <optgroup label="Whole Level">
                <option value="__all__">
                  🏠 Entire {activeFloor.name} ({rooms.length > 0 ? `${rooms.length} Rooms • ` : ''}{targetAreaSqFt} sq ft)
                </option>
              </optgroup>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 260 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search tiles, marble, pvc, matte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: 8,
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: '10px 24px',
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'all', label: 'All Finishes' },
            { id: 'tile', label: '🧱 Tiles & Ceramics' },
            { id: 'marble', label: '🏛️ Italian Marble' },
            { id: 'pvc', label: '🛡️ PVC & Vinyl' },
            { id: 'concrete', label: '✨ Matte & Microcement' },
            { id: 'wood', label: '🪵 Hardwood & Parquet' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as FlooringCategoryTab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: isActive ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-card)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main Body: Presets Grid + Customizer Sidebar */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Flooring Materials Card Grid */}
          <div
            style={{
              flex: 1,
              padding: 20,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 14,
              alignContent: 'start',
            }}
          >
            {filteredPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    border: `2px solid ${isSelected ? '#2563eb' : 'var(--border-subtle)'}`,
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.06)' : 'var(--bg-card)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 8px 24px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Visual Pattern Swatch */}
                  <div
                    style={{
                      height: 100,
                      backgroundColor: preset.color,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage:
                        preset.category === 'tile'
                          ? `linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)`
                          : preset.category === 'marble'
                          ? `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%), linear-gradient(135deg, rgba(0,0,0,0.08) 25%, transparent 25%)`
                          : preset.category === 'pvc' || preset.category === 'wood'
                          ? `repeating-linear-gradient(0deg, transparent, transparent 16px, rgba(0,0,0,0.15) 17px)`
                          : `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)`,
                      backgroundSize:
                        preset.category === 'tile'
                          ? '24px 24px'
                          : preset.category === 'pvc' || preset.category === 'wood'
                          ? '100% 20px'
                          : '8px 8px',
                    }}
                  >
                    {/* Category Stamp Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: 9.5,
                        fontWeight: 700,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {preset.categoryLabel}
                    </span>

                    {/* Sheen Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontSize: 9.5,
                        fontWeight: 700,
                        backgroundColor: preset.sheen === 'glossy' ? 'rgba(37, 99, 235, 0.85)' : 'rgba(71, 85, 105, 0.85)',
                        color: '#ffffff',
                        textTransform: 'capitalize',
                      }}
                    >
                      {preset.sheen}
                    </span>

                    {isSelected && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                      >
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {preset.description}
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{preset.thicknessMm} mm thick</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ${preset.costPerSqFt.toFixed(2)} / sq ft
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Customizer Panel */}
          <div
            style={{
              width: 320,
              backgroundColor: 'var(--bg-sidebar)',
              borderLeft: '1px solid var(--border-medium)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                Flooring Specifications
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {selectedPreset.name}
              </div>
            </div>

            {/* Tile Size Selector */}
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tile / Plank Dimensions
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                {[
                  { inches: 12, label: '12" × 12"' },
                  { inches: 24, label: '24" × 24"' },
                  { inches: 36, label: '24" × 48"' },
                  { inches: 48, label: '8" × 48" Plank' },
                ].map((size) => (
                  <button
                    key={size.inches}
                    onClick={() => setTileSizeInches(size.inches)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: tileSizeInches === size.inches ? 700 : 500,
                      border: `1px solid ${tileSizeInches === size.inches ? '#2563eb' : 'var(--border-subtle)'}`,
                      background: tileSizeInches === size.inches ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
                      color: tileSizeInches === size.inches ? '#2563eb' : 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Layout */}
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Joint Layout Pattern
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                {(['grid', 'staggered', 'herringbone'] as const).map((pat) => (
                  <button
                    key={pat}
                    onClick={() => setTilePattern(pat)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: tilePattern === pat ? 700 : 500,
                      border: `1px solid ${tilePattern === pat ? '#2563eb' : 'var(--border-subtle)'}`,
                      background: tilePattern === pat ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
                      color: tilePattern === pat ? '#2563eb' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {pat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sheen Finish */}
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Surface Sheen & Reflectivity
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                {(['matte', 'satin', 'glossy'] as const).map((sh) => (
                  <button
                    key={sh}
                    onClick={() => setFinishSheen(sh)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: finishSheen === sh ? 700 : 500,
                      border: `1px solid ${finishSheen === sh ? '#2563eb' : 'var(--border-subtle)'}`,
                      background: finishSheen === sh ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
                      color: finishSheen === sh ? '#2563eb' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {sh === 'matte' ? 'Matte' : sh === 'satin' ? 'Satin' : 'High-Gloss'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grout Color */}
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Grout Joint Line Tone
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {[
                  { color: '#ffffff', label: 'White' },
                  { color: '#cbd5e1', label: 'Light Grey' },
                  { color: '#64748b', label: 'Charcoal' },
                  { color: '#1e293b', label: 'Black' },
                  { color: '#d4cbb8', label: 'Sand' },
                ].map((g) => (
                  <button
                    key={g.color}
                    onClick={() => setGroutColor(g.color)}
                    title={g.label}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: g.color,
                      border: `2px solid ${groutColor === g.color ? '#2563eb' : 'var(--border-medium)'}`,
                      cursor: 'pointer',
                      boxShadow: groutColor === g.color ? '0 0 0 2px rgba(37,99,235,0.4)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Cost & Area Takeoff Box */}
            <div
              style={{
                marginTop: 'auto',
                padding: 14,
                borderRadius: 10,
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Installation Target:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{targetRoomName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Coverage Area:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{targetAreaSqFt} sq ft</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Est. Tiles (+10% waste):</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-primary)' }}>~{approxTileCount} pcs</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTop: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Est. Budget:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>${estimatedCost}</span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 8,
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Apply {selectedPreset.categoryLabel} Flooring</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
