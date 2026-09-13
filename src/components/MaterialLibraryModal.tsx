import React, { useState, useMemo } from 'react';
import { MaterialDef, MaterialCategory } from '../core/model/types';
import { DEFAULT_MATERIALS } from '../core/model/defaults';
import { X, Search, Check, Sparkles, Paintbrush } from 'lucide-react';

interface MaterialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (materialId: string) => void;
  activeMaterialId?: string | null;
  targetDescription?: string; // e.g. "Living Room Flooring" or "Selected Wall Interior Finish"
  materials?: MaterialDef[];
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All Finishes', value: 'all' },
  { label: '🎨 Paints & Plasters', value: 'paint' },
  { label: '🪵 Hardwoods', value: 'wood' },
  { label: '🏛️ Marbles & Stone', value: 'marble' },
  { label: '🧱 Tiles & Ceramics', value: 'tile' },
  { label: '🏡 Masonry & Siding', value: 'brick' },
  { label: '✨ Metals & Glass', value: 'metal' },
];

export const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectMaterial,
  activeMaterialId,
  targetDescription = 'Surface Finish',
  materials = DEFAULT_MATERIALS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedId, setHighlightedId] = useState<string | null>(activeMaterialId || null);

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'brick'
          ? mat.category === 'brick' || mat.category === 'concrete'
          : selectedCategory === 'metal'
          ? mat.category === 'metal' || mat.category === 'glass'
          : mat.category === selectedCategory);

      const matchesSearch =
        !searchQuery.trim() ||
        mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [materials, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 820,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Paintbrush size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Architectural Material Library
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Applying to: <strong style={{ color: 'var(--accent-blue)' }}>{targetDescription}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--bg-surface)',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 8,
              padding: '6px 12px',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search finish by name (e.g. Oak, Calacatta, Brick, Stucco)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                width: '100%',
              }}
            />
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedCategory(tab.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-panel)',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Material Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 16,
            background: 'var(--bg-panel)',
          }}
        >
          {filteredMaterials.map((mat) => {
            const isSelected = highlightedId === mat.id;
            const isCurrent = activeMaterialId === mat.id;

            return (
              <div
                key={mat.id}
                onClick={() => setHighlightedId(mat.id)}
                onDoubleClick={() => {
                  onSelectMaterial(mat.id);
                  onClose();
                }}
                style={{
                  border: `2px solid ${
                    isSelected ? 'var(--accent-blue)' : isCurrent ? 'rgba(59, 130, 246, 0.5)' : 'var(--border-medium)'
                  }`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.12s ease, border-color 0.12s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(59, 130, 246, 0.25)' : 'none',
                }}
              >
                {/* Swatch Preview Box */}
                <div
                  style={{
                    height: 90,
                    backgroundColor: mat.color,
                    position: 'relative',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage:
                      mat.category === 'wood'
                        ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 4px, transparent 4px, transparent 12px)'
                        : mat.category === 'marble'
                        ? 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                        : mat.category === 'tile'
                        ? 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)'
                        : mat.category === 'brick'
                        ? 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 6px, transparent 6px, transparent 14px)'
                        : undefined,
                    backgroundSize: mat.category === 'tile' ? '24px 24px' : undefined,
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        color: '#38bdf8',
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      Active
                    </div>
                  )}

                  {isSelected && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-blue)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {mat.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize',
                    }}
                  >
                    <span>{mat.category}</span>
                    <span>Rough: {Math.round(mat.roughness * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {filteredMaterials.length} materials • Double-click to apply immediately
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-panel)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              disabled={!highlightedId}
              onClick={() => {
                if (highlightedId) {
                  onSelectMaterial(highlightedId);
                  onClose();
                }
              }}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: highlightedId ? 'var(--accent-blue)' : 'var(--bg-input)',
                color: highlightedId ? '#fff' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: highlightedId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: highlightedId ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
              }}
            >
              <Sparkles size={14} />
              Apply Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
