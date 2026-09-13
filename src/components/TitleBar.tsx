import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, Floor } from '../core/model/types';
import { formatFeetInches } from '../core/units';
import {
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  PlusCircle,
  Layers,
  Box,
  Columns2,
  ChevronDown,
  Plus,
  Ghost,
  Sliders,
  Paintbrush,
  Printer,
  BarChart3,
  IndianRupee,
  Cuboid,
  HelpCircle,
  Home,
  Check,
  Grid,
  Trees,
  ChefHat,
  Compass,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface TitleBarProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  lastAutosaveTime: Date | null;
  onOpenTour?: () => void;
  floors: Floor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onOpenAddFloorModal: () => void;
  showUnderlay: boolean;
  onToggleUnderlay: () => void;
  onOpenSettingsModal?: () => void;
  onUpdate3D?: () => void;
  onOpenMaterialLibrary?: () => void;
  onOpenFlooringStudio?: () => void;
  onOpenBlueprintExport?: () => void;
  onOpenAreaSchedule?: () => void;
  onOpenCostEstimator?: () => void;
  onOpenElevationView?: () => void;
  onOpenSectionView?: () => void;
  onOpenSiteModal?: () => void;
  onOpenKitchenStudio?: () => void;
  onOpenVastuModal?: () => void;
  onOpenSmartPlanModal?: () => void;
  onNavigateHome?: () => void;
  onNavigateDownload?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  projectName,
  onProjectNameChange,
  isDirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewMode,
  onViewModeChange,
  onNew,
  onOpen,
  onSave,
  lastAutosaveTime,
  onOpenTour,
  floors,
  activeFloorId,
  onSelectFloor,
  onOpenAddFloorModal,
  showUnderlay,
  onToggleUnderlay,
  onOpenSettingsModal,
  onOpenMaterialLibrary,
  onOpenFlooringStudio,
  onOpenKitchenStudio,
  onOpenVastuModal,
  onOpenSmartPlanModal,
  onNavigateHome,
  onNavigateDownload,
  onOpenBlueprintExport,
  onOpenAreaSchedule,
  onOpenCostEstimator,
  onOpenElevationView,
  onOpenSectionView,
  onOpenSiteModal,
}) => {
  const [openMenu, setOpenMenu] = useState<'floor' | 'views' | 'tools' | 'all' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));

  // Dynamic ResizeObserver to auto-adapt to any screen size without clipping
  useEffect(() => {
    if (!barRef.current) return;
    const updateSize = () => {
      if (barRef.current) {
        setWidth(barRef.current.getBoundingClientRect().width);
      }
    };
    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(barRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0];

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  // Adaptive breakpoints
  const isUltraWide = width >= 1520;
  const isWide = width >= 1260;
  const isMedium = width >= 1060;
  const isCompact = width >= 860;

  return (
    <header
      ref={barRef}
      style={{
        height: 50,
        background: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isWide ? '0 12px' : '0 8px',
        userSelect: 'none',
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        gap: isWide ? 8 : 4,
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Left Section: Brand & File Actions ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isWide ? 6 : 4, flexShrink: 0 }}>
        {/* Brand Logo & Name */}
        <div
          onClick={onNavigateHome}
          title={onNavigateHome ? 'Home Designer PRO (Click to return to Homepage)' : 'Home Designer PRO'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            cursor: onNavigateHome ? 'pointer' : 'default',
            padding: '2px 4px',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => {
            if (onNavigateHome) e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            if (onNavigateHome) e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              flexShrink: 0,
            }}
          >
            <Home size={15} color="#ffffff" />
          </div>
          {isMedium && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Home Designer
              </span>
              {isWide && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  PRO
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Project Name & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 4px',
              maxWidth: isUltraWide ? 130 : isWide ? 100 : isMedium ? 85 : 70,
              cursor: 'text',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--border-medium)')}
            onBlur={(e) => (e.target.style.border = '1px solid transparent')}
            title="Click to rename project"
          />

          {isWide && (
            isDirty ? (
              <span
                title="Unsaved changes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#d97706',
                  background: '#fffbeb',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: '1px solid #fde68a',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                Unsaved
              </span>
            ) : (
              <span
                title={`Autosaved ${lastAutosaveTime ? lastAutosaveTime.toLocaleTimeString() : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: '1px solid #a7f3d0',
                  whiteSpace: 'nowrap',
                }}
              >
                <Check size={10} />
                Saved
              </span>
            )
          )}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Quick File & History Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={onNew}
            title="New Project (⌘N)"
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <PlusCircle size={13} />
            {isUltraWide && <span>New</span>}
          </button>

          <button
            onClick={onOpen}
            title="Open Project (⌘O)"
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FolderOpen size={13} />
            {isUltraWide && <span>Open</span>}
          </button>

          <button
            onClick={onSave}
            title="Save Project (⌘S)"
            style={{
              padding: '4px 7px',
              borderRadius: 'var(--radius-sm)',
              color: isDirty ? '#ffffff' : 'var(--text-secondary)',
              background: isDirty ? 'var(--accent-blue)' : 'transparent',
              border: isDirty ? '1px solid var(--accent-blue-hover)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: isDirty ? 600 : 400,
            }}
            onMouseEnter={(e) => {
              if (!isDirty) e.currentTarget.style.background = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isDirty) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Save size={13} />
            {isWide && <span>Save</span>}
          </button>

          <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 1px' }} />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            style={{
              padding: '4px 5px',
              borderRadius: 'var(--radius-sm)',
              color: canUndo ? 'var(--text-secondary)' : 'var(--text-muted)',
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (canUndo) e.currentTarget.style.background = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Undo2 size={13} />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            style={{
              padding: '4px 5px',
              borderRadius: 'var(--radius-sm)',
              color: canRedo ? 'var(--text-secondary)' : 'var(--text-muted)',
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (canRedo) e.currentTarget.style.background = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Redo2 size={13} />
          </button>
        </div>
      </div>

      {/* ─── Center Section: Segmented View Switcher ─── */}
      <div
        style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: 2,
          borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onViewModeChange('2d')}
          title="2D Floor Plan View"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isWide ? '4px 8px' : '4px 6px',
            fontSize: 11,
            fontWeight: viewMode === '2d' ? 600 : 500,
            borderRadius: 5,
            background: viewMode === '2d' ? '#ffffff' : 'transparent',
            color: viewMode === '2d' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            boxShadow: viewMode === '2d' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={13} />
          {isMedium && <span>2D Plan</span>}
        </button>

        <button
          onClick={() => onViewModeChange('split')}
          title="Split View (2D & 3D side-by-side)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isWide ? '4px 8px' : '4px 6px',
            fontSize: 11,
            fontWeight: viewMode === 'split' ? 600 : 500,
            borderRadius: 5,
            background: viewMode === 'split' ? '#ffffff' : 'transparent',
            color: viewMode === 'split' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            boxShadow: viewMode === 'split' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Columns2 size={13} />
          {isMedium && <span>Split</span>}
        </button>

        <button
          onClick={() => onViewModeChange('3d-orbit')}
          title="3D Perspective & Orbit View"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: isWide ? '4px 8px' : '4px 6px',
            fontSize: 11,
            fontWeight: viewMode === '3d-orbit' ? 600 : 500,
            borderRadius: 5,
            background: viewMode === '3d-orbit' ? '#ffffff' : 'transparent',
            color: viewMode === '3d-orbit' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            boxShadow: viewMode === '3d-orbit' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Box size={13} />
          {isMedium && <span>3D View</span>}
        </button>
      </div>

      {/* ─── Right Section: Fully Responsive Architectural Action Center ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isWide ? 4 : 3, flexShrink: 0 }}>
        {/* Floor Level Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpenMenu(openMenu === 'floor' ? null : 'floor')}
            title="Floor Levels & Elevation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 7px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <Layers size={12} color="var(--accent-blue)" />
            <span>{activeFloor ? (isWide ? activeFloor.name : activeFloor.name.replace('Floor', 'Fl.')) : 'Floor'}</span>
            {isUltraWide && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                {activeFloor ? formatFeetInches(activeFloor.elevation) : ''}
              </span>
            )}
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {openMenu === 'floor' && (
            <div
              style={{
                position: 'absolute',
                top: 34,
                right: 0,
                width: 250,
                background: '#ffffff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                zIndex: 1000,
              }}
            >
              <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Storey / Level
              </div>

              {floors.map((fl) => {
                const isActive = fl.id === activeFloorId;
                return (
                  <button
                    key={fl.id}
                    onClick={() => {
                      onSelectFloor(fl.id);
                      setOpenMenu(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--accent-blue-subtle)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={13} color={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                      <span>{fl.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {formatFeetInches(fl.elevation)}
                    </span>
                  </button>
                );
              })}

              <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={() => {
                  setOpenMenu(null);
                  onOpenAddFloorModal();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                  fontSize: 12,
                  textAlign: 'left',
                }}
              >
                <Plus size={14} />
                <span>Add Floor Level</span>
              </button>

              <button
                onClick={onToggleUnderlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: showUnderlay ? '#f0fdf4' : 'transparent',
                  border: '1px solid ' + (showUnderlay ? '#bbf7d0' : 'transparent'),
                  color: showUnderlay ? '#15803d' : 'var(--text-secondary)',
                  fontSize: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ghost size={13} />
                  <span>Lower Floor Underlay</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{showUnderlay ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 1px' }} />

        {/* ─── PRIMARY DESIGN STUDIOS (Always Available & Responsive) ─── */}
        
        {/* Smart Plan Assistant AI Button */}
        {onOpenSmartPlanModal && (
          <button
            onClick={onOpenSmartPlanModal}
            title="Smart Plan Assistant — Generate complete house plan from text instructions (Press A)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isWide ? '4px 8px' : '4px 6px',
              borderRadius: 5,
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              border: '1px solid #c4b5fd',
              color: '#6d28d9',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(109, 40, 217, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ddd6fe';
              e.currentTarget.style.borderColor = '#a78bfa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f5f3ff, #ede9fe)';
              e.currentTarget.style.borderColor = '#c4b5fd';
            }}
          >
            <Wand2 size={13} color="#7c3aed" />
            <span>AI Plan</span>
            {isUltraWide && <span style={{ fontSize: 9, padding: '0 3px', background: '#ddd6fe', borderRadius: 2, color: '#5b21b6', fontWeight: 700 }}>A</span>}
          </button>
        )}

        {/* Site Plan Button */}
        {onOpenSiteModal && (
          <button
            onClick={onOpenSiteModal}
            title="Site Plan Studio — Landscape, Setbacks, Outdoor Living & Sun Study (Press P)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isWide ? '4px 7px' : '4px 5px',
              borderRadius: 5,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dcfce7';
              e.currentTarget.style.borderColor = '#86efac';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0fdf4';
              e.currentTarget.style.borderColor = '#bbf7d0';
            }}
          >
            <Trees size={13} color="#16a34a" />
            {isMedium && <span>Site</span>}
            {isUltraWide && <span style={{ fontSize: 9, padding: '0 3px', background: '#dcfce7', borderRadius: 2, color: '#166534', fontWeight: 700 }}>P</span>}
          </button>
        )}

        {/* Kitchen Studio Button */}
        {onOpenKitchenStudio && (
          <button
            onClick={onOpenKitchenStudio}
            title="Modular Kitchen Studio & Cabinetry Planner (Press K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isWide ? '4px 7px' : '4px 5px',
              borderRadius: 5,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#c2410c',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffedd5';
              e.currentTarget.style.borderColor = '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff7ed';
              e.currentTarget.style.borderColor = '#fed7aa';
            }}
          >
            <ChefHat size={13} color="#ea580c" />
            {isMedium && <span>Kitchen</span>}
            {isUltraWide && <span style={{ fontSize: 9, padding: '0 3px', background: '#ffedd5', borderRadius: 2, color: '#9a3412', fontWeight: 700 }}>K</span>}
          </button>
        )}

        {/* Vastu Shastra Button */}
        {onOpenVastuModal && (
          <button
            onClick={onOpenVastuModal}
            title="Vastu Shastra Compass & Spatial Harmony (Press U)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isWide ? '4px 7px' : '4px 5px',
              borderRadius: 5,
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              color: '#7e22ce',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3e8ff';
              e.currentTarget.style.borderColor = '#d8b4fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#faf5ff';
              e.currentTarget.style.borderColor = '#e9d5ff';
            }}
          >
            <Compass size={13} color="#9333ea" />
            {isMedium && <span>Vastu</span>}
            {isUltraWide && <span style={{ fontSize: 9, padding: '0 3px', background: '#f3e8ff', borderRadius: 2, color: '#6b21a8', fontWeight: 700 }}>U</span>}
          </button>
        )}

        {/* ─── Architectural Views & Takeoff Menus ─── */}
        {isWide ? (
          <>
            {/* Views Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenMenu(openMenu === 'views' ? null : 'views')}
                title="Elevation & Cross-Section Cut Views"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 6px',
                  borderRadius: 5,
                  background: openMenu === 'views' ? '#e2e8f0' : '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Cuboid size={13} color="#475569" />
                <span>Views</span>
                <ChevronDown size={10} color="var(--text-muted)" />
              </button>

              {openMenu === 'views' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 34,
                    right: 0,
                    width: 240,
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Architectural Views
                  </div>

                  {onOpenElevationView && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenElevationView();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Cuboid size={14} color="#2563eb" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Wall Elevations</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>North, South, East, West projections</div>
                      </div>
                    </button>
                  )}

                  {onOpenSectionView && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenSectionView();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Layers size={14} color="#0891b2" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Cross-Section Cut (A-A')</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Vertical section cut through storeys</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Finishes & BOQ Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
                title="Finishes, Takeoff & Project Settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 6px',
                  borderRadius: 5,
                  background: openMenu === 'tools' ? '#e2e8f0' : '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={13} color="#64748b" />
                <span>{isUltraWide ? 'Finishes & BOQ' : 'Tools'}</span>
                <ChevronDown size={10} color="var(--text-muted)" />
              </button>

              {openMenu === 'tools' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 34,
                    right: 0,
                    width: 250,
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Finishes & Materials
                  </div>

                  {onOpenFlooringStudio && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenFlooringStudio();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Grid size={14} color="#059669" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Flooring Studio (Tiles, Marble, PVC)</div>
                      </div>
                    </button>
                  )}

                  {onOpenMaterialLibrary && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenMaterialLibrary();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Paintbrush size={14} color="#7c3aed" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Material Library</div>
                      </div>
                    </button>
                  )}

                  <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

                  <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Quantity Takeoff & Cost
                  </div>

                  {onOpenAreaSchedule && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenAreaSchedule();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <BarChart3 size={14} color="#2563eb" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Area Schedule & BOQ</div>
                      </div>
                    </button>
                  )}

                  {onOpenCostEstimator && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenCostEstimator();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <IndianRupee size={14} color="#d97706" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Cost Estimator (₹ / $)</div>
                      </div>
                    </button>
                  )}

                  <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

                  {onOpenSettingsModal && (
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenSettingsModal();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Sliders size={14} color="#64748b" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Project Defaults</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Compact Combined "More Studios & Tools" Menu for Smaller Screens */
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenMenu(openMenu === 'all' ? null : 'all')}
              title="All Studios & Tools"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '4px 6px',
                borderRadius: 5,
                background: openMenu === 'all' ? '#e2e8f0' : '#f8fafc',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={13} color="#2563eb" />
              <span>More ▾</span>
            </button>

            {openMenu === 'all' && (
              <div
                style={{
                  position: 'absolute',
                  top: 34,
                  right: 0,
                  width: 260,
                  maxHeight: '75vh',
                  overflowY: 'auto',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Architectural Studios & Views
                </div>

                {onOpenSmartPlanModal && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenSmartPlanModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                      border: '1px solid #c4b5fd',
                      textAlign: 'left',
                      color: '#6d28d9',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Wand2 size={14} color="#7c3aed" />
                    <div>
                      <div>Smart Plan Assistant (AI)</div>
                    </div>
                  </button>
                )}

                {onOpenElevationView && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenElevationView();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Cuboid size={14} color="#2563eb" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Wall Elevations</div>
                    </div>
                  </button>
                )}

                {onOpenSectionView && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenSectionView();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Layers size={14} color="#0891b2" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Cross-Section Cut (A-A')</div>
                    </div>
                  </button>
                )}

                {onOpenFlooringStudio && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenFlooringStudio();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Grid size={14} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Flooring Studio (Tiles, Marble)</div>
                    </div>
                  </button>
                )}

                {onOpenMaterialLibrary && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenMaterialLibrary();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Paintbrush size={14} color="#7c3aed" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Material Library</div>
                    </div>
                  </button>
                )}

                <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

                <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Takeoff & Calculations
                </div>

                {onOpenAreaSchedule && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenAreaSchedule();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <BarChart3 size={14} color="#2563eb" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Area Schedule & BOQ</div>
                    </div>
                  </button>
                )}

                {onOpenCostEstimator && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenCostEstimator();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <IndianRupee size={14} color="#d97706" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Cost Estimator (₹ / $)</div>
                    </div>
                  </button>
                )}

                {onOpenSettingsModal && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenSettingsModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Sliders size={14} color="#64748b" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Project Defaults</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Export Blueprint (Always Visible) ─── */}
        {onOpenBlueprintExport && (
          <button
            onClick={onOpenBlueprintExport}
            title="Export Blueprint Drawing Sheet (PDF & High-Res PNG)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isWide ? '5px 10px' : '5px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-blue-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-blue)')}
          >
            <Printer size={12} />
            <span>{isWide ? 'Export Plan' : 'Export'}</span>
          </button>
        )}

        {/* Quick Guide Tour */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            title="Beginner Guide & Interactive Feature Tour"
            style={{
              padding: 5,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <HelpCircle size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
