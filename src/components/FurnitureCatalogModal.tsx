import React, { useState } from 'react';
import { FURNITURE_CATALOG, FurnitureCatalogItem } from '../core/model/furniture';
import { formatFeetInches } from '../core/units';
import { Armchair, Bed, Utensils, Bath, Car, Box, X, Search } from 'lucide-react';

interface FurnitureCatalogModalProps {
  isOpen: boolean;
  onSelect: (item: FurnitureCatalogItem) => void;
  onClose: () => void;
}

export const FurnitureCatalogModal: React.FC<FurnitureCatalogModalProps> = ({
  isOpen,
  onSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Items', icon: <Box size={14} /> },
    { id: 'bedroom', label: 'Bedroom & Wardrobes', icon: <Bed size={14} /> },
    { id: 'living', label: 'Living Room', icon: <Armchair size={14} /> },
    { id: 'dining', label: 'Dining', icon: <Utensils size={14} /> },
    { id: 'kitchen', label: 'Kitchen', icon: <Utensils size={14} /> },
    { id: 'bathroom', label: 'Bath & Sanitary', icon: <Bath size={14} /> },
    { id: 'exterior', label: 'Porch & Exterior', icon: <Car size={14} /> },
  ];

  const filteredItems = FURNITURE_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 720,
          maxHeight: '88vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
            background: 'var(--bg-surface)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              🛋️ Furniture & Architectural Fixture Catalog
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Select professional 3D furniture or fixtures with real feet & inches dimensions
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Categories */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search wardrobe, bed, sofa, dining, toilet, kitchen, sink, gate..."
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)',
                    background: isActive ? '#2563eb' : 'var(--bg-surface)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Grid with Professional Photography Images */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 14,
            flex: 1,
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
              }}
            >
              {/* Image Banner */}
              <div
                style={{
                  height: 145,
                  background: '#f8fafc',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: item.imageUrl.endsWith('.svg') ? '12px' : '4px',
                    transition: 'transform 0.3s ease',
                  }}
                  onError={(e) => {
                    // Fallback in case of missing asset
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  {item.category}
                </span>
              </div>

              {/* Item Info */}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {item.name}
                </span>

                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {item.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {formatFeetInches(item.defaultDimensions.width)} × {formatFeetInches(item.defaultDimensions.depth)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#2563eb',
                      background: 'rgba(37, 99, 235, 0.08)',
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    + Place on Plan
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
