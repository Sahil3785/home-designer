import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Project,
  Floor,
  Wall,
  WallOpening,
  Point2D,
  ViewMode,
  Staircase,
  Column,
  Roof,
  FurnitureInstance,
  ReferencePlan,
  Room,
  ArchitecturalSymbol,
  SymbolType,
  SectionCut,
  FlooringConfig,
  SitePlan,
  OutdoorFeature,
} from './core/model/types';
import { createDefaultProject, DEFAULT_MATERIALS } from './core/model/defaults';
import {
  HistoryManager,
  AddWallCommand,
  DeleteWallCommand,
  AddOpeningCommand,
  DeleteOpeningCommand,
  UpdateOpeningCommand,
  UpdateWallBatchCommand,
  AddFloorCommand,
  DeleteFloorCommand,
  UpdateFloorCommand,
  AddStaircaseCommand,
  UpdateStaircaseCommand,
  DeleteStaircaseCommand,
  AddColumnCommand,
  UpdateColumnCommand,
  DeleteColumnCommand,
  UpdateRoofCommand,
  UpdateSettingsCommand,
  SetReferencePlanCommand,
  UpdateReferencePlanCommand,
  RemoveReferencePlanCommand,
  AddFurnitureCommand,
  UpdateFurnitureCommand,
  DeleteFurnitureCommand,
  UpdateProjectSettingsCommand,
  UpdateRoomCommand,
  AddSymbolCommand,
  UpdateSymbolCommand,
  DeleteSymbolCommand,
  UpdateSectionCutCommand,
  UpdateSiteSettingsCommand,
  AddOutdoorFeatureCommand,
  UpdateOutdoorFeatureCommand,
  DeleteOutdoorFeatureCommand,
} from './core/history';
import {
  saveProjectToFile,
  openProjectFromFile,
  autosaveProject,
  loadAutosavedProject,
} from './core/storage';
import { Sixteenths, SNAP_PRESETS, formatFeetInches } from './core/units';
import { detectRoomsFromWalls } from './core/model/roomDetection';
import { addFloorToProject } from './core/model/floors';
import { createDefaultReferencePlan, calibrateReferencePlan } from './core/model/referencePlan';

import { TitleBar } from './components/TitleBar';
import { Toolbar2D, CADTool } from './components/Toolbar2D';
import { PlanEditor2D } from './components/PlanEditor2D';
import { Viewer3D } from './components/Viewer3D';
import { InspectorPanel } from './components/InspectorPanel';
import { StatusBar } from './components/StatusBar';
import { OnboardingTour } from './components/OnboardingTour';
import { FeatureToast, ToastMessage } from './components/FeatureToast';
import { AddFloorModal } from './components/AddFloorModal';
import { RoofModal } from './components/RoofModal';
import { ReferencePlanHUD } from './components/ReferencePlanHUD';
import { CalibrateModal } from './components/CalibrateModal';
import { FurnitureCatalogModal } from './components/FurnitureCatalogModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { MaterialLibraryModal } from './components/MaterialLibraryModal';
import { ExportPlanModal } from './components/ExportPlanModal';
import { AreaScheduleModal } from './components/AreaScheduleModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';
import { ElevationViewModal } from './components/ElevationViewModal';
import { SectionViewModal } from './components/SectionViewModal';
import { FlooringModal } from './components/FlooringModal';
import { SitePlanModal } from './components/SitePlanModal';
import { KitchenStudioModal } from './components/KitchenStudioModal';
import { VastuModal } from './components/VastuModal';
import { SmartPlanAssistantModal } from './components/SmartPlanAssistantModal';
import { KitchenDesign } from './core/model/kitchen';
import {
  AddKitchenDesignCommand,
  UpdateKitchenDesignCommand,
  DeleteKitchenDesignCommand,
  GenerateFloorPlanCommand,
} from './core/history';

import './styles/theme.css';

interface AppProps {
  onNavigateHome?: () => void;
  onNavigateDownload?: () => void;
}

export function App({ onNavigateHome, onNavigateDownload }: AppProps = {}) {
  const initialProject = useMemo(() => {
    const autosaved = loadAutosavedProject();
    if (autosaved) {
      return autosaved.project;
    }
    return createDefaultProject();
  }, []);

  const historyRef = useRef<HistoryManager>(new HistoryManager(initialProject));
  const [project, setProject] = useState<Project>(initialProject);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(new Date());

  // UI Editor States
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeTool, setActiveTool] = useState<CADTool>('select');
  const [selectedWallId, setSelectedWallId] = useState<string | null>('wall_south');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [selectedStairId, setSelectedStairId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [activeThickness, setActiveThickness] = useState<Sixteenths>(96); // 6" default
  const [snapGrid, setSnapGrid] = useState<Sixteenths>(SNAP_PRESETS.ONE_INCH);
  const [orthogonalSnap, setOrthogonalSnap] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<Point2D | null>(null);
  const [zoom, setZoom] = useState(1.0);

  // Modals
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [isRoofModalOpen, setIsRoofModalOpen] = useState(false);
  const [isExportPlanOpen, setIsExportPlanOpen] = useState(false);
  const [isMaterialLibraryOpen, setIsMaterialLibraryOpen] = useState(false);
  const [materialTarget, setMaterialTarget] = useState<{
    type: 'room-floor' | 'wall-interior' | 'wall-exterior';
    id: string;
    currentMaterialId?: string;
    title?: string;
  } | null>(null);

  // Phase 4 Modals
  const [isAreaScheduleOpen, setIsAreaScheduleOpen] = useState(false);
  const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState(false);
  const [isElevationViewOpen, setIsElevationViewOpen] = useState(false);
  const [isSectionViewOpen, setIsSectionViewOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isFlooringModalOpen, setIsFlooringModalOpen] = useState(false);
  const [flooringModalRoomId, setFlooringModalRoomId] = useState<string | null>(null);

  // Phase 7 Site & Landscape Planning
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [selectedOutdoorFeatureId, setSelectedOutdoorFeatureId] = useState<string | null>(null);

  // Phase 8 Kitchen Studio & Vastu Shastra & AI Plan Assistant
  const [isKitchenStudioOpen, setIsKitchenStudioOpen] = useState(false);
  const [isVastuModalOpen, setIsVastuModalOpen] = useState(false);
  const [isSmartPlanModalOpen, setIsSmartPlanModalOpen] = useState(false);

  // Reference Plan & Scale Calibration
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibModalData, setCalibModalData] = useState<{
    p1: Point2D;
    p2: Point2D;
    pixelDist: number;
  } | null>(null);

  // Furniture & Fixtures
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [activeFurnitureCatalogId, setActiveFurnitureCatalogId] = useState<string>('bed_queen');
  const [isFurnitureCatalogOpen, setIsFurnitureCatalogOpen] = useState(false);

  // MEP Architectural Fixtures
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [activeSymbolType, setActiveSymbolType] = useState<SymbolType>('light_point');

  // Project Defaults Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 3D Walk camera state and refresh trigger
  const [walkCameraState, setWalkCameraState] = useState<{ x: Sixteenths; y: Sixteenths; yaw: number } | null>(null);
  const [update3DKey, setUpdate3DKey] = useState(0);

  // Beginner Tour and Toast States
  const [isTourOpen, setIsTourOpen] = useState(() => {
    return localStorage.getItem('homedesigner_tour_completed') !== 'true';
  });
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (toast: ToastMessage) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(toast);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Subscribe to history manager changes
  useEffect(() => {
    const unsubscribe = historyRef.current.subscribe((updatedProject, u, r) => {
      // Automatically detect and update rooms for the active floor
      const activeFloor = updatedProject.floors.find((f) => f.id === updatedProject.activeFloorId);
      if (activeFloor) {
        const detectedRooms = detectRoomsFromWalls(activeFloor);
        const floorsWithRooms = updatedProject.floors.map((fl) => {
          if (fl.id !== activeFloor.id) return fl;
          return { ...fl, rooms: detectedRooms.length > 0 ? detectedRooms : (fl.rooms || []) };
        });
        setProject({ ...updatedProject, floors: floorsWithRooms });
      } else {
        setProject(updatedProject);
      }

      setCanUndo(u);
      setCanRedo(r);
      setIsDirty(historyRef.current.isDirty());
    });
    return unsubscribe;
  }, []);

  // Periodic autosave every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (historyRef.current.isDirty()) {
        autosaveProject(project);
        setLastAutosave(new Date());
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [project]);

  // Handle CAD Tool Switching with Beginner Contextual Toasts
  const handleToolSelect = (tool: CADTool) => {
    setActiveTool(tool);
    if (tool !== 'select' && tool !== 'mep' && tool !== 'site') {
      setSelectedOpeningId(null);
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSymbolId(null);
      setSelectedOutdoorFeatureId(null);
    }

    switch (tool) {
      case 'wall':
        showToast({
          id: 'tool_wall',
          title: '✏️ Wall Tool Active',
          description: 'Click anywhere on the canvas to start your wall, stretch it to desired length, and click again to place.',
          tip: 'Continuous wall drawing is on. Hold Shift to lock orthogonal angles. Press Esc to finish.',
        });
        break;
      case 'door':
        showToast({
          id: 'tool_door',
          title: '🚪 Door Tool Active',
          description: 'Hover your cursor over any wall to see a live preview of the door with exact distance from corners.',
          tip: 'Press F or Spacebar while hovering to flip swing direction (inside/outside)!',
        });
        break;
      case 'window':
        showToast({
          id: 'tool_window',
          title: '🪟 Window Tool Active',
          description: 'Hover over any wall to preview window placement, then click to install it.',
          tip: 'The 3D model on the right will automatically cut out the window opening in real time!',
        });
        break;
      case 'ventilator':
        showToast({
          id: 'tool_ventilator',
          title: '💨 High-Sill Ventilator Tool Active',
          description: 'Hover over any bathroom or kitchen wall to install a high-sill ventilator at 6\'6" sill height.',
          tip: 'High-sill placement provides natural ventilation and exhaust while preserving privacy!',
        });
        break;
      case 'furniture':
        setIsFurnitureCatalogOpen(true);
        showToast({
          id: 'tool_furniture',
          title: '🛋️ Residential Fixtures & Furniture',
          description: 'Select an architectural fixture or furniture piece to place on your floor plan.',
          tip: 'All items generate accurate 2D symbols and 3D procedural solid models immediately!',
        });
        break;
      case 'column':
        showToast({
          id: 'tool_column',
          title: '🏛️ Structural Column Tool Active',
          description: 'Click on the floor plan to install a structural pillar or porch column.',
          tip: 'Select the column to toggle between Rectangular and Round shapes in the Inspector.',
        });
        break;
      case 'stair':
        showToast({
          id: 'tool_stair',
          title: '🪜 Staircase Tool Active',
          description: 'Click on the plan to place an architectural flight of stairs.',
          tip: 'Stairs calculate code-compliant risers (2R + T) and cut a stairwell opening in the upper floor slab!',
        });
        break;
      case 'roof':
        setIsRoofModalOpen(true);
        showToast({
          id: 'tool_roof',
          title: '🏠 Roof Generator',
          description: 'Configure Gable, Hip, Shed, or Flat roof slopes and overhangs for the house.',
        });
        break;
      case 'flooring':
        showToast({
          id: 'tool_flooring',
          title: '🏁 Flooring Studio Active',
          description: 'Click any enclosed room on the 2D plan to choose and customize Tiles, Italian Marble, PVC/Vinyl, or Matte finishes.',
          tip: 'You can apply to individual rooms or batch-apply to the entire floor with live area takeoff & cost calculation.',
        });
        break;
      case 'site':
        setIsSiteModalOpen(true);
        showToast({
          id: 'tool_site',
          title: '🌳 Site & Landscape Planning Active',
          description: 'Configure property boundaries, setback zoning envelopes, outdoor living features, and solar sun study.',
          tip: 'Click any outdoor feature to inspect or press P anytime to open Site Studio.',
        });
        break;
      case 'mep':
        showToast({
          id: 'tool_mep',
          title: '⚡ MEP Architectural Fixtures',
          description: 'Place electrical switchboards, power sockets, ceiling fans, light points, DB panels, and plumbing fixtures.',
          tip: 'Press 1-9 to quickly change fixture type. Press R to rotate fixture before or after placing!',
        });
        break;
      case 'select':
        showToast({
          id: 'tool_select',
          title: '👆 Select Tool Active',
          description: 'Click on any wall, door, staircase, or column to inspect and adjust its dimensions.',
          tip: 'Drag any corner where walls meet to stretch connected walls together!',
        });
        break;
      case 'pan':
        showToast({
          id: 'tool_pan',
          title: '✋ Hand / Pan Tool Active',
          description: 'Click and drag to pan across your floor plan.',
          tip: 'Tip: You can also pan anytime using two-finger trackpad scroll or by holding Spacebar!',
        });
        break;
      case 'measure':
        showToast({
          id: 'tool_measure',
          title: '📏 Measure Tool Active',
          description: 'Click between any two points to measure clear distance in feet and inches.',
        });
        break;
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      } else if (mod && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (mod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedSymbolId) {
          e.preventDefault();
          handleDeleteSymbol(selectedSymbolId);
        } else if (selectedFurnitureId) {
          e.preventDefault();
          handleDeleteFurniture(selectedFurnitureId);
        } else if (selectedStairId) {
          e.preventDefault();
          handleDeleteStaircase(selectedStairId);
        } else if (selectedColumnId) {
          e.preventDefault();
          handleDeleteColumn(selectedColumnId);
        } else if (selectedOpeningId && selectedWallId) {
          e.preventDefault();
          handleDeleteOpening(selectedWallId, selectedOpeningId);
        } else if (selectedOutdoorFeatureId) {
          e.preventDefault();
          handleDeleteOutdoorFeature(selectedOutdoorFeatureId);
        } else if (selectedWallId) {
          e.preventDefault();
          handleDeleteSelectedWall();
        }
      } else if (e.key.toLowerCase() === 'v') {
        handleToolSelect('select');
      } else if (e.key.toLowerCase() === 'h') {
        handleToolSelect('pan');
      } else if (e.key.toLowerCase() === 'w') {
        handleToolSelect('wall');
      } else if (e.key.toLowerCase() === 'd') {
        handleToolSelect('door');
      } else if (e.key.toLowerCase() === 'i') {
        handleToolSelect('window');
      } else if (e.key.toLowerCase() === 'e') {
        handleToolSelect('mep');
      } else if (e.key.toLowerCase() === 'c') {
        handleToolSelect('column');
      } else if (e.key.toLowerCase() === 's') {
        handleToolSelect('stair');
      } else if (e.key.toLowerCase() === 'p') {
        setIsSiteModalOpen(true);
      } else if (e.key.toLowerCase() === 'r') {
        if (activeTool !== 'mep' && !selectedSymbolId) {
          handleToolSelect('roof');
        }
      } else if (e.key.toLowerCase() === 'm') {
        handleToolSelect('measure');
      } else if (e.key.toLowerCase() === 'k') {
        setIsKitchenStudioOpen(true);
      } else if (e.key.toLowerCase() === 'u') {
        setIsVastuModalOpen(true);
      } else if (e.key.toLowerCase() === 'a') {
        setIsSmartPlanModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWallId, selectedOpeningId, selectedStairId, selectedColumnId, selectedFurnitureId, selectedSymbolId, selectedOutdoorFeatureId, activeTool, project]);

  const handleUndo = () => historyRef.current.undo();
  const handleRedo = () => historyRef.current.redo();

  const handleNew = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Create a new project?')) {
      return;
    }
    const fresh = createDefaultProject();
    historyRef.current.reset(fresh);
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
    setSelectedFurnitureId(null);
    setSelectedSymbolId(null);
  };

  const handleSave = async () => {
    const res = await saveProjectToFile(project);
    if (res.success) {
      historyRef.current.markClean();
      setIsDirty(false);
      setLastAutosave(new Date());
      showToast({
        id: 'toast_save',
        title: '💾 Project Saved',
        description: `Project "${project.name}" saved successfully to disk.`,
      });
    }
  };

  const handleOpen = async () => {
    const res = await openProjectFromFile();
    if (res.success && res.project) {
      historyRef.current.reset(res.project);
      setSelectedWallId(null);
      setSelectedOpeningId(null);
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSymbolId(null);
      showToast({
        id: 'toast_open',
        title: '📂 Project Opened',
        description: `Loaded project "${res.project.name}".`,
      });
    }
  };

  // Floor Management Handlers
  const handleSelectFloor = (floorId: string) => {
    setProject((p) => ({ ...p, activeFloorId: floorId }));
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
    setSelectedFurnitureId(null);
    const fl = project.floors.find((f) => f.id === floorId);
    if (fl) {
      showToast({
        id: `toast_floor_${fl.id}`,
        title: `Switched to ${fl.name}`,
        description: `Floor elevation: ${fl.elevation / 16} inches (${fl.elevation / 192} ft).`,
      });
    }
  };

  const handleAddFloor = (options: {
    name: string;
    ceilingHeight: Sixteenths;
    cloneWallsFromFloorId?: string;
  }) => {
    const { newFloor } = addFloorToProject(project, options);
    historyRef.current.execute(new AddFloorCommand(newFloor));
    showToast({
      id: `toast_new_floor_${newFloor.id}`,
      title: `✨ Added ${newFloor.name}`,
      description: `Elevated at ${newFloor.elevation / 192} ft above ground. Load-bearing walls aligned.`,
    });
  };

  const handleDeleteFloor = (floorId: string) => {
    historyRef.current.execute(new DeleteFloorCommand(floorId));
    showToast({
      id: 'toast_del_floor',
      title: 'Floor Deleted',
      description: 'Floor level removed and remaining elevations restacked.',
    });
  };

  const handleUpdateFloor = (
    floorId: string,
    updates: { name?: string; ceilingHeight?: Sixteenths; slabThickness?: Sixteenths }
  ) => {
    historyRef.current.execute(new UpdateFloorCommand(floorId, updates));
  };

  const handleToggleUnderlay = () => {
    const current = project.settings.showUnderlay !== false;
    historyRef.current.execute(
      new UpdateSettingsCommand(project, { showUnderlay: !current })
    );
    showToast({
      id: 'toast_underlay',
      title: !current ? '👻 Lower Floor Underlay: ON' : '👻 Lower Floor Underlay: OFF',
      description: !current
        ? 'Dashed outline of the lower floor is now visible for load-bearing alignment.'
        : 'Underlay hidden.',
    });
  };

  const handleToggleRoof3D = () => {
    const current = project.settings.showRoof3D !== false;
    historyRef.current.execute(
      new UpdateSettingsCommand(project, { showRoof3D: !current })
    );
  };

  // Wall and Opening Handlers
  const handleAddWall = (start: Point2D, end: Point2D, thickness: Sixteenths) => {
    const activeFloorId = project.activeFloorId;
    const activeFloor = project.floors.find((f) => f.id === activeFloorId) || project.floors[0];

    const newWall: Wall = {
      id: `wall_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      floorId: activeFloorId,
      start,
      end,
      thickness,
      height: activeFloor.ceilingHeight,
      openings: [],
    };

    historyRef.current.execute(new AddWallCommand(activeFloorId, newWall));
    setSelectedWallId(newWall.id);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
  };

  const handleUpdateWall = (updatedWall: Wall) => {
    setProject((prev) => {
      const activeFloor = prev.floors.find((f) => f.id === updatedWall.floorId);
      if (!activeFloor) return prev;
      const updatedWalls = activeFloor.walls.map((w) => (w.id === updatedWall.id ? updatedWall : w));
      const updatedFloor = { ...activeFloor, walls: updatedWalls };
      const rooms = detectRoomsFromWalls(updatedFloor);

      return {
        ...prev,
        floors: prev.floors.map((fl) =>
          fl.id === updatedWall.floorId ? { ...updatedFloor, rooms } : fl
        ),
      };
    });
  };

  const handleUpdateWallBatch = (updatedWalls: Wall[]) => {
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor) return;

    historyRef.current.execute(
      new UpdateWallBatchCommand(project.activeFloorId, updatedWalls, activeFloor.walls)
    );
  };

  const handleDeleteSelectedWall = () => {
    if (!selectedWallId) return;
    historyRef.current.execute(new DeleteWallCommand(project.activeFloorId, selectedWallId));
    setSelectedWallId(null);
    setSelectedOpeningId(null);
  };

  const handleAddOpening = (wallId: string, opening: WallOpening) => {
    historyRef.current.execute(new AddOpeningCommand(project.activeFloorId, wallId, opening));
    setSelectedOpeningId(opening.id);
  };

  const handleUpdateOpening = (wallId: string, opening: WallOpening) => {
    historyRef.current.execute(new UpdateOpeningCommand(project.activeFloorId, wallId, opening));
  };

  const handleDeleteOpening = (wallId: string, openingId: string) => {
    historyRef.current.execute(new DeleteOpeningCommand(project.activeFloorId, wallId, openingId));
    setSelectedOpeningId(null);
  };

  const handleToggleDoorOpen = (wallId: string, openingId: string) => {
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor) return;
    const wall = activeFloor.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const opening = wall.openings.find((o) => o.id === openingId);
    if (!opening) return;
    handleUpdateOpening(wallId, { ...opening, isOpen: !opening.isOpen });
  };

  const handleSelectOpening = (openingId: string | null, wallId: string | null) => {
    setSelectedOpeningId(openingId);
    if (wallId) {
      setSelectedWallId(wallId);
      setSelectedRoomId(null);
    }
    if (openingId) {
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSymbolId(null);
    }
  };

  // Room Handlers
  const handleSelectRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    if (roomId) {
      setSelectedWallId(null);
      setSelectedOpeningId(null);
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSymbolId(null);
    }
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    historyRef.current.execute(new UpdateRoomCommand(project.activeFloorId, updatedRoom));
  };

  const handleOpenFlooringStudio = (roomId?: string) => {
    if (roomId) {
      setSelectedRoomId(roomId);
      setFlooringModalRoomId(roomId);
    } else {
      setFlooringModalRoomId(selectedRoomId || null);
    }
    setIsFlooringModalOpen(true);
  };

  const handleApplyRoomFlooring = (
    floorId: string,
    roomId: string,
    materialId: string,
    config?: FlooringConfig
  ) => {
    const floor = project.floors.find((f) => f.id === floorId);
    if (!floor) return;

    // Persist to floor-level properties
    historyRef.current.execute(
      new UpdateFloorCommand(floorId, {
        floorMaterialId: materialId,
        flooringConfig: config,
      })
    );

    let room = floor.rooms.find((r) => r.id === roomId);
    if (!room && floor.rooms.length > 0) {
      room = floor.rooms[0];
    }

    if (room) {
      const updatedRoom: Room = {
        ...room,
        floorMaterialId: materialId,
        flooringConfig: config,
      };
      historyRef.current.execute(new UpdateRoomCommand(floorId, updatedRoom));
    } else if (floor.walls.length >= 3) {
      const detected = detectRoomsFromWalls({
        ...floor,
        floorMaterialId: materialId,
        flooringConfig: config,
      });
      if (detected.length > 0) {
        const target = { ...detected[0], floorMaterialId: materialId, flooringConfig: config };
        historyRef.current.execute(new UpdateRoomCommand(floorId, target));
      }
    }

    const mat = (project.materials || DEFAULT_MATERIALS).find((m) => m.id === materialId);
    showToast({
      id: `floor_apply_${Date.now()}`,
      title: '✨ Flooring Applied',
      description: `Installed ${mat?.name || 'custom finish'} in ${room?.name || 'room'}.`,
      tip: 'Switch to 3D Orbit or Split view to inspect realistic PBR lighting, grout joints, and surface gloss.',
    });
  };

  const handleApplyFloorFlooringBatch = (
    floorId: string,
    materialId: string,
    config?: FlooringConfig
  ) => {
    const floor = project.floors.find((f) => f.id === floorId);
    if (!floor) return;

    // Persist to floor level
    historyRef.current.execute(
      new UpdateFloorCommand(floorId, {
        floorMaterialId: materialId,
        flooringConfig: config,
      })
    );

    if (floor.rooms.length > 0) {
      floor.rooms.forEach((room) => {
        const updatedRoom: Room = {
          ...room,
          floorMaterialId: materialId,
          flooringConfig: config,
        };
        historyRef.current.execute(new UpdateRoomCommand(floorId, updatedRoom));
      });
    } else if (floor.walls.length >= 3) {
      const detected = detectRoomsFromWalls({
        ...floor,
        floorMaterialId: materialId,
        flooringConfig: config,
      });
      detected.forEach((rm) => {
        const target = { ...rm, floorMaterialId: materialId, flooringConfig: config };
        historyRef.current.execute(new UpdateRoomCommand(floorId, target));
      });
    }

    const mat = (project.materials || DEFAULT_MATERIALS).find((m) => m.id === materialId);
    showToast({
      id: `floor_batch_${Date.now()}`,
      title: '🏛️ Whole-Floor Flooring Applied',
      description: `Batch applied ${mat?.name || 'custom finish'} across all rooms on ${floor.name}.`,
      tip: 'All rooms on this level now share matching architectural material and joint alignments.',
    });
  };

  const handleOpenMaterialLibrary = (target: {
    type: 'room-floor' | 'wall-interior' | 'wall-exterior';
    id: string;
    currentMaterialId?: string;
    title?: string;
  }) => {
    setMaterialTarget(target);
    setIsMaterialLibraryOpen(true);
  };

  const handleSelectMaterial = (materialId: string) => {
    if (!materialTarget) return;
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor) return;

    if (materialTarget.type === 'room-floor') {
      const room = activeFloor.rooms.find((r) => r.id === materialTarget.id);
      if (room) {
        handleUpdateRoom({ ...room, floorMaterialId: materialId });
      }
    } else if (materialTarget.type === 'wall-interior') {
      const wall = activeFloor.walls.find((w) => w.id === materialTarget.id);
      if (wall) {
        handleUpdateWall({ ...wall, materialInteriorId: materialId });
      }
    } else if (materialTarget.type === 'wall-exterior') {
      const wall = activeFloor.walls.find((w) => w.id === materialTarget.id);
      if (wall) {
        handleUpdateWall({ ...wall, materialExteriorId: materialId });
      }
    }
  };

  // Staircase Handlers
  const handleAddStaircase = (stair: Staircase) => {
    historyRef.current.execute(new AddStaircaseCommand(project.activeFloorId, stair));
    setSelectedStairId(stair.id);
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedColumnId(null);
    setSelectedSymbolId(null);
    showToast({
      id: `toast_stair_${stair.id}`,
      title: '🪜 Staircase Placed',
      description: `${stair.riserCount} risers connecting to the floor above with automatic ceiling cutout.`,
    });
  };

  const handleUpdateStaircase = (stair: Staircase) => {
    historyRef.current.execute(new UpdateStaircaseCommand(project.activeFloorId, stair));
  };

  const handleDeleteStaircase = (stairId: string) => {
    historyRef.current.execute(new DeleteStaircaseCommand(project.activeFloorId, stairId));
    setSelectedStairId(null);
  };

  // Column Handlers
  const handleAddColumn = (col: Column) => {
    historyRef.current.execute(new AddColumnCommand(project.activeFloorId, col));
    setSelectedColumnId(col.id);
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedSymbolId(null);
    showToast({
      id: `toast_col_${col.id}`,
      title: '🏛️ Column Placed',
      description: 'Structural pillar installed. Drag to move or adjust dimensions in the Inspector.',
    });
  };

  const handleUpdateColumn = (col: Column) => {
    historyRef.current.execute(new UpdateColumnCommand(project.activeFloorId, col));
  };

  const handleDeleteColumn = (colId: string) => {
    historyRef.current.execute(new DeleteColumnCommand(project.activeFloorId, colId));
    setSelectedColumnId(null);
  };

  // Roof Handler
  const handleSaveRoof = (roof: Roof | undefined) => {
    historyRef.current.execute(new UpdateRoofCommand(project.activeFloorId, roof));
    showToast({
      id: 'toast_roof_update',
      title: roof ? '🏠 Roof Generated' : 'Roof Removed',
      description: roof
        ? `${roof.type.toUpperCase()} roof with ${roof.pitch}/12 pitch applied.`
        : 'Roof removed from building model.',
    });
  };

  // Reference Plan Handlers
  const handleImportReferencePlan = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const activeFloorId = project.activeFloorId;
        const refPlan = createDefaultReferencePlan(
          activeFloorId,
          file.name,
          dataUrl,
          img.naturalWidth,
          img.naturalHeight
        );
        historyRef.current.execute(new SetReferencePlanCommand(activeFloorId, refPlan));

        // Start calibration prompt immediately
        setIsCalibrating(true);
        showToast({
          id: 'toast_ref_plan_imported',
          title: '📐 Reference Plan Imported',
          description: `Loaded "${file.name}". Click two points along any known dimension (like total width 22' 0") to calibrate scale!`,
          tip: 'Tip: After calibrating, toggle Lock so clicks pass directly through to walls and doors.',
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateReferencePlan = (updates: Partial<ReferencePlan>) => {
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor?.referencePlan) return;
    historyRef.current.execute(
      new UpdateReferencePlanCommand(project.activeFloorId, updates)
    );
  };

  const handleRemoveReferencePlan = () => {
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor?.referencePlan) return;
    historyRef.current.execute(new RemoveReferencePlanCommand(project.activeFloorId));
    setIsCalibrating(false);
    setCalibModalData(null);
    showToast({
      id: 'toast_ref_plan_removed',
      title: 'Reference Plan Removed',
      description: 'Background drawing layer removed.',
    });
  };

  const handleCalibrationPointsPicked = (p1: Point2D, p2: Point2D, pixelDistance: number) => {
    setCalibModalData({ p1, p2, pixelDist: pixelDistance });
  };

  const handleApplyCalibration = (knownDistance: Sixteenths) => {
    const activeFloor = project.floors.find((f) => f.id === project.activeFloorId);
    if (!activeFloor?.referencePlan || !calibModalData) return;

    const calibrated = calibrateReferencePlan(
      activeFloor.referencePlan,
      calibModalData.p1,
      calibModalData.p2,
      knownDistance
    );
    historyRef.current.execute(
      new UpdateReferencePlanCommand(project.activeFloorId, calibrated)
    );
    setIsCalibrating(false);
    setCalibModalData(null);

    showToast({
      id: 'toast_calibrated',
      title: '✓ Reference Plan Scaled Accurately',
      description: `Calibrated to real world dimensions. Ready for manual tracing of walls, doors, and rooms.`,
      tip: 'Remember to lock the reference plan so your mouse clicks trace walls directly over it!',
    });
  };

  // Furniture Handlers
  const handleAddFurniture = (furniture: FurnitureInstance) => {
    historyRef.current.execute(new AddFurnitureCommand(project.activeFloorId, furniture));
    setSelectedFurnitureId(furniture.id);
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
    setSelectedSymbolId(null);
    showToast({
      id: `toast_furn_placed_${furniture.id}`,
      title: `🛋️ ${furniture.name} Installed`,
      description: 'Fixture placed on floor plan. Drag to position, or use the Inspector to adjust dimensions & orientation.',
    });
  };

  const handleUpdateFurniture = (furniture: FurnitureInstance) => {
    historyRef.current.execute(
      new UpdateFurnitureCommand(project.activeFloorId, furniture.id, furniture)
    );
  };

  const handleDeleteFurniture = (furnitureId: string) => {
    historyRef.current.execute(new DeleteFurnitureCommand(project.activeFloorId, furnitureId));
    setSelectedFurnitureId(null);
  };

  // MEP Architectural Fixture Handlers
  const handleAddSymbol = (symbol: ArchitecturalSymbol) => {
    historyRef.current.execute(new AddSymbolCommand(project.activeFloorId, symbol));
    setSelectedSymbolId(symbol.id);
    setSelectedWallId(null);
    setSelectedOpeningId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
    setSelectedFurnitureId(null);
    showToast({
      id: `toast_sym_${symbol.id}`,
      title: `⚡ ${symbol.name} Installed`,
      description: `Placed on plan (${Math.round(symbol.elevation / 16)}" AFF, ${symbol.wattage || 0}W). Rotate with 'R' or fine-tune in the Inspector.`,
    });
  };

  const handleUpdateSymbol = (symbol: ArchitecturalSymbol) => {
    historyRef.current.execute(new UpdateSymbolCommand(project.activeFloorId, symbol));
  };

  const handleDeleteSymbol = (symbolId: string) => {
    historyRef.current.execute(new DeleteSymbolCommand(project.activeFloorId, symbolId));
    setSelectedSymbolId(null);
  };

  const handleSelectSymbol = (symbolId: string | null) => {
    setSelectedSymbolId(symbolId);
    if (symbolId) {
      setSelectedWallId(null);
      setSelectedRoomId(null);
      setSelectedOpeningId(null);
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSectionId(null);
    }
  };

  const handleUpdateSectionCut = (updatedCut: SectionCut) => {
    historyRef.current.execute(new UpdateSectionCutCommand(project.activeFloorId, updatedCut));
  };

  const handleSelectSection = (sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    if (sectionId) {
      setSelectedWallId(null);
      setSelectedRoomId(null);
      setSelectedOpeningId(null);
      setSelectedStairId(null);
      setSelectedColumnId(null);
      setSelectedFurnitureId(null);
      setSelectedSymbolId(null);
    }
  };

  // Project Architectural Defaults Handler
  const handleUpdateProjectSettings = (settingsPatch: Partial<Project['settings']>) => {
    historyRef.current.execute(
      new UpdateProjectSettingsCommand(settingsPatch)
    );
    setIsSettingsModalOpen(false);
    showToast({
      id: 'toast_settings_updated',
      title: 'Architectural Defaults Saved',
      description: 'Default ceiling height, wall thicknesses, and opening sizes updated in feet and inches.',
    });
  };

  // Phase 7 Site Planning & Outdoor Living Handlers
  const handleUpdateSiteSettings = (updates: Partial<SitePlan>) => {
    historyRef.current.execute(new UpdateSiteSettingsCommand(updates));
  };

  const handleAddOutdoorFeature = (feature: OutdoorFeature) => {
    historyRef.current.execute(new AddOutdoorFeatureCommand(feature));
    setSelectedOutdoorFeatureId(feature.id);
    showToast({
      id: `toast_outdoor_${Date.now()}`,
      title: `✨ Added ${feature.name}`,
      description: 'Feature placed on outdoor site plan with realistic dimensions and 3D materials.',
      tip: 'Switch to 3D Orbit view to inspect the landscape and day/night solar shadows.',
    });
  };

  const handleUpdateOutdoorFeature = (featureId: string, updates: Partial<OutdoorFeature>) => {
    historyRef.current.execute(new UpdateOutdoorFeatureCommand(featureId, updates));
  };

  const handleDeleteOutdoorFeature = (featureId: string) => {
    historyRef.current.execute(new DeleteOutdoorFeatureCommand(featureId));
    if (selectedOutdoorFeatureId === featureId) {
      setSelectedOutdoorFeatureId(null);
    }
  };

  const handleUpdateTimeOfDay = (hours: number) => {
    historyRef.current.execute(new UpdateProjectSettingsCommand({ sunTimeHours: hours }));
  };

  // Kitchen Studio handlers
  const handleAddKitchen = (kitchen: KitchenDesign) => {
    historyRef.current.execute(new AddKitchenDesignCommand(project.activeFloorId, kitchen));
    setUpdate3DKey((k) => k + 1);
    showToast({
      id: 'toast_kitchen_add',
      title: '🍳 Kitchen Added',
      description: `${kitchen.name} (${kitchen.layoutType}) has been placed on the active floor.`,
    });
  };

  const handleUpdateKitchen = (kitchen: KitchenDesign) => {
    historyRef.current.execute(new UpdateKitchenDesignCommand(project.activeFloorId, kitchen));
    setUpdate3DKey((k) => k + 1);
  };

  const handleDeleteKitchen = (kitchenId: string) => {
    historyRef.current.execute(new DeleteKitchenDesignCommand(project.activeFloorId, kitchenId));
    setUpdate3DKey((k) => k + 1);
    showToast({
      id: 'toast_kitchen_del',
      title: 'Kitchen Removed',
      description: 'The kitchen design has been removed from this floor.',
    });
  };

  // Vastu handlers
  const handleToggleVastuGrid = () => {
    historyRef.current.execute(
      new UpdateProjectSettingsCommand({ showVastuGrid: !project.settings.showVastuGrid })
    );
  };

  const handleUpdateNorthOrientation = (degrees: number) => {
    historyRef.current.execute(new UpdateProjectSettingsCommand({ northAngle: degrees }));
  };

  const handleApplySmartPlan = (generatedFloor: Floor, title: string) => {
    historyRef.current.execute(
      new GenerateFloorPlanCommand(generatedFloor, project.activeFloorId, title)
    );
    setSelectedWallId(null);
    setSelectedRoomId(null);
    setSelectedOpeningId(null);
    setSelectedFurnitureId(null);
    setSelectedStairId(null);
    setSelectedColumnId(null);
    setSelectedSymbolId(null);
    setSelectedOutdoorFeatureId(null);
    setUpdate3DKey((k) => k + 1);
    showToast({
      id: 'smart_plan_applied',
      title: '✨ Floor Plan Generated!',
      description: `Created ${title} with ${generatedFloor.rooms.length} rooms and full 3D model.`,
    });
  };

  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      {/* Title Bar */}
      <TitleBar
        projectName={project.name}
        onProjectNameChange={(name) => setProject((p) => ({ ...p, name }))}
        isDirty={isDirty}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        lastAutosaveTime={lastAutosave}
        onOpenTour={() => setIsTourOpen(true)}
        floors={project.floors}
        activeFloorId={project.activeFloorId}
        onSelectFloor={handleSelectFloor}
        onOpenAddFloorModal={() => setIsAddFloorModalOpen(true)}
        showUnderlay={project.settings.showUnderlay !== false}
        onToggleUnderlay={handleToggleUnderlay}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onUpdate3D={() => setUpdate3DKey((k) => k + 1)}
        onOpenMaterialLibrary={() =>
          handleOpenMaterialLibrary({
            type: 'room-floor',
            id: '',
            title: 'Architectural Material Finishes Library',
          })
        }
        onOpenFlooringStudio={() => handleOpenFlooringStudio()}
        onOpenBlueprintExport={() => setIsExportPlanOpen(true)}
        onOpenAreaSchedule={() => setIsAreaScheduleOpen(true)}
        onOpenCostEstimator={() => setIsCostEstimatorOpen(true)}
        onOpenElevationView={() => setIsElevationViewOpen(true)}
        onOpenSectionView={() => setIsSectionViewOpen(true)}
        onOpenSiteModal={() => setIsSiteModalOpen(true)}
        onOpenKitchenStudio={() => setIsKitchenStudioOpen(true)}
        onOpenVastuModal={() => setIsVastuModalOpen(true)}
        onOpenSmartPlanModal={() => setIsSmartPlanModalOpen(true)}
        onNavigateHome={onNavigateHome}
        onNavigateDownload={onNavigateDownload}
      />

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* CAD Toolbar */}
        <Toolbar2D
          activeTool={activeTool}
          onToolChange={handleToolSelect}
          selectedWallId={selectedWallId}
          selectedStairId={selectedStairId}
          selectedColumnId={selectedColumnId}
          selectedFurnitureId={selectedFurnitureId}
          selectedSymbolId={selectedSymbolId}
          selectedOutdoorFeatureId={selectedOutdoorFeatureId}
          onDeleteSelected={() => {
            if (selectedSymbolId) {
              handleDeleteSymbol(selectedSymbolId);
            } else if (selectedOutdoorFeatureId) {
              handleDeleteOutdoorFeature(selectedOutdoorFeatureId);
            } else if (selectedFurnitureId) {
              handleDeleteFurniture(selectedFurnitureId);
            } else if (selectedStairId) {
              handleDeleteStaircase(selectedStairId);
            } else if (selectedColumnId) {
              handleDeleteColumn(selectedColumnId);
            } else if (selectedOpeningId && selectedWallId) {
              handleDeleteOpening(selectedWallId, selectedOpeningId);
            } else {
              handleDeleteSelectedWall();
            }
          }}
          activeThickness={activeThickness}
          onThicknessChange={(th) => {
            setActiveThickness(th);
            showToast({
              id: 'toast_thickness',
              title: 'Wall Thickness Updated',
              description: `Default wall thickness set to ${formatFeetInches(th)}.`,
            });
          }}
          snapGrid={snapGrid}
          onSnapGridChange={(snap) => {
            setSnapGrid(snap);
            showToast({
              id: 'toast_snap',
              title: 'Snap Grid Updated',
              description: `Grid snapping set to ${snap === 16 ? '1 inch' : snap === 32 ? '2 inches' : snap === 96 ? '6 inches' : '1 foot'}.`,
            });
          }}
          orthogonalSnap={orthogonalSnap}
          onOrthogonalSnapToggle={() => {
            setOrthogonalSnap((o) => {
              const next = !o;
              showToast({
                id: 'toast_ortho',
                title: next ? '📐 Ortho Snap: ON' : '📐 Ortho Snap: OFF',
                description: next
                  ? 'Walls will snap to 0°, 45°, and 90° straight lines.'
                  : 'Free angle drawing enabled.',
              });
              return next;
            });
          }}
          onImportReferencePlan={handleImportReferencePlan}
          onOpenFurnitureCatalog={() => setIsFurnitureCatalogOpen(true)}
          onOpenFlooringStudio={() => handleOpenFlooringStudio()}
          onOpenSiteModal={() => setIsSiteModalOpen(true)}
          activeSymbolType={activeSymbolType}
          onSymbolTypeChange={setActiveSymbolType}
        />

        {/* Viewport Area */}
        <main style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {(viewMode === '2d' || viewMode === 'split') && (
            <div
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                position: 'relative',
                borderRight: viewMode === 'split' ? '1px solid var(--border-medium)' : 'none',
              }}
            >
              {activeFloor.referencePlan && (
                <ReferencePlanHUD
                  plan={activeFloor.referencePlan}
                  isCalibrating={isCalibrating}
                  onToggleVisibility={() =>
                    handleUpdateReferencePlan({
                      isVisible: activeFloor.referencePlan?.isVisible === false ? true : false,
                    })
                  }
                  onToggleLock={() =>
                    handleUpdateReferencePlan({
                      isLocked: !activeFloor.referencePlan?.isLocked,
                    })
                  }
                  onOpacityChange={(opacity) => handleUpdateReferencePlan({ opacity })}
                  onStartCalibration={() => setIsCalibrating(true)}
                  onCancelCalibration={() => {
                    setIsCalibrating(false);
                    setCalibModalData(null);
                  }}
                  onResetOrigin={() => handleUpdateReferencePlan({ x: 0, y: 0 })}
                  onRemovePlan={handleRemoveReferencePlan}
                />
              )}

              <PlanEditor2D
                project={project}
                activeTool={activeTool}
                selectedWallId={selectedWallId}
                selectedOpeningId={selectedOpeningId}
                selectedRoomId={selectedRoomId}
                selectedStairId={selectedStairId}
                selectedColumnId={selectedColumnId}
                selectedFurnitureId={selectedFurnitureId}
                selectedSymbolId={selectedSymbolId}
                selectedSectionId={selectedSectionId}
                selectedOutdoorFeatureId={selectedOutdoorFeatureId}
                onSelectWall={(id) => {
                  setSelectedWallId(id);
                  if (id) {
                    setSelectedRoomId(null);
                    setSelectedOpeningId(null);
                    setSelectedStairId(null);
                    setSelectedColumnId(null);
                    setSelectedFurnitureId(null);
                    setSelectedSymbolId(null);
                    setSelectedSectionId(null);
                    setSelectedOutdoorFeatureId(null);
                  }
                }}
                onSelectRoom={(id) => {
                  handleSelectRoom(id);
                  if (id) setSelectedOutdoorFeatureId(null);
                }}
                onOpenFlooringStudio={handleOpenFlooringStudio}
                onOpenSiteModal={() => setIsSiteModalOpen(true)}
                onSelectOpening={handleSelectOpening}
                onSelectStair={(id) => {
                  setSelectedStairId(id);
                  if (id) {
                    setSelectedWallId(null);
                    setSelectedRoomId(null);
                    setSelectedOpeningId(null);
                    setSelectedColumnId(null);
                    setSelectedFurnitureId(null);
                    setSelectedSymbolId(null);
                    setSelectedSectionId(null);
                    setSelectedOutdoorFeatureId(null);
                  }
                }}
                onSelectColumn={(id) => {
                  setSelectedColumnId(id);
                  if (id) {
                    setSelectedWallId(null);
                    setSelectedRoomId(null);
                    setSelectedOpeningId(null);
                    setSelectedStairId(null);
                    setSelectedFurnitureId(null);
                    setSelectedSymbolId(null);
                    setSelectedSectionId(null);
                    setSelectedOutdoorFeatureId(null);
                  }
                }}
                onSelectFurniture={(id) => {
                  setSelectedFurnitureId(id);
                  if (id) {
                    setSelectedWallId(null);
                    setSelectedRoomId(null);
                    setSelectedOpeningId(null);
                    setSelectedStairId(null);
                    setSelectedColumnId(null);
                    setSelectedSymbolId(null);
                    setSelectedSectionId(null);
                    setSelectedOutdoorFeatureId(null);
                  }
                }}
                onSelectSymbol={(id) => {
                  handleSelectSymbol(id);
                  if (id) setSelectedOutdoorFeatureId(null);
                }}
                onSelectSection={(id) => {
                  handleSelectSection(id);
                  if (id) setSelectedOutdoorFeatureId(null);
                }}
                onSelectOutdoorFeature={(id) => {
                  setSelectedOutdoorFeatureId(id);
                  if (id) {
                    setSelectedWallId(null);
                    setSelectedRoomId(null);
                    setSelectedOpeningId(null);
                    setSelectedStairId(null);
                    setSelectedColumnId(null);
                    setSelectedFurnitureId(null);
                    setSelectedSymbolId(null);
                    setSelectedSectionId(null);
                  }
                }}
                onAddWall={handleAddWall}
                onUpdateWall={handleUpdateWall}
                onUpdateWallBatch={handleUpdateWallBatch}
                onAddOpening={handleAddOpening}
                onUpdateOpening={handleUpdateOpening}
                onAddStaircase={handleAddStaircase}
                onUpdateStaircase={handleUpdateStaircase}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onAddFurniture={handleAddFurniture}
                onUpdateFurniture={handleUpdateFurniture}
                onAddSymbol={handleAddSymbol}
                onUpdateSymbol={handleUpdateSymbol}
                onUpdateSectionCut={handleUpdateSectionCut}
                activeFurnitureCatalogId={activeFurnitureCatalogId}
                onOpenFurnitureCatalog={() => setIsFurnitureCatalogOpen(true)}
                activeSymbolType={activeSymbolType}
                onSymbolTypeChange={setActiveSymbolType}
                onOpenRoofConfig={() => setIsRoofModalOpen(true)}
                activeThickness={activeThickness}
                snapGrid={snapGrid}
                orthogonalSnap={orthogonalSnap}
                onCursorMove={setCursorCoords}
                zoom={zoom}
                onZoomChange={setZoom}
                isCalibrating={isCalibrating}
                onCalibrationPointsPicked={handleCalibrationPointsPicked}
                walkCameraState={walkCameraState}
              />
            </div>
          )}

          {(viewMode === '3d-orbit' || viewMode === 'split') && (
            <div style={{ flex: 1, height: '100%', display: 'flex' }}>
              <Viewer3D
                key={update3DKey}
                project={project}
                selectedWallId={selectedWallId}
                onSelectWall={(id) => {
                  setSelectedWallId(id);
                  setSelectedOpeningId(null);
                  setSelectedRoomId(null);
                  setSelectedStairId(null);
                  setSelectedColumnId(null);
                  setSelectedFurnitureId(null);
                  setSelectedSymbolId(null);
                }}
                showRoof={project.settings.showRoof3D !== false}
                onToggleShowRoof={handleToggleRoof3D}
                onWalkCameraMove={setWalkCameraState}
                onToggleDoorOpen={handleToggleDoorOpen}
                onUpdate3D={() => setUpdate3DKey((k) => k + 1)}
              />
            </div>
          )}
        </main>

        {/* Right Properties Inspector Panel */}
        <InspectorPanel
          project={project}
          selectedWallId={selectedWallId}
          selectedOpeningId={selectedOpeningId}
          selectedRoomId={selectedRoomId}
          selectedStairId={selectedStairId}
          selectedColumnId={selectedColumnId}
          selectedFurnitureId={selectedFurnitureId}
          selectedSymbolId={selectedSymbolId}
          onSelectOpening={handleSelectOpening}
          onSelectRoom={handleSelectRoom}
          onUpdateWall={handleUpdateWall}
          onUpdateRoom={handleUpdateRoom}
          onAddOpening={handleAddOpening}
          onUpdateOpening={handleUpdateOpening}
          onDeleteOpening={handleDeleteOpening}
          onUpdateStaircase={handleUpdateStaircase}
          onDeleteStaircase={handleDeleteStaircase}
          onUpdateColumn={handleUpdateColumn}
          onDeleteColumn={handleDeleteColumn}
          onUpdateFurniture={handleUpdateFurniture}
          onDeleteFurniture={handleDeleteFurniture}
          onUpdateSymbol={handleUpdateSymbol}
          onDeleteSymbol={handleDeleteSymbol}
          onUpdateReferencePlan={handleUpdateReferencePlan}
          onStartCalibration={() => setIsCalibrating(true)}
          onOpenMaterialLibrary={handleOpenMaterialLibrary}
          onOpenFlooringStudio={handleOpenFlooringStudio}
          onUpdateFloor={handleUpdateFloor}
          onOpenAddFloorModal={() => setIsAddFloorModalOpen(true)}
          onDeleteFloor={handleDeleteFloor}
          onOpenRoofModal={() => setIsRoofModalOpen(true)}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        cursorCoords={cursorCoords}
        snapGrid={snapGrid}
        project={project}
        zoom={zoom}
        onResetZoom={() => setZoom(1.0)}
      />

      {/* Modals */}
      <AddFloorModal
        isOpen={isAddFloorModalOpen}
        onClose={() => setIsAddFloorModalOpen(false)}
        floors={project.floors}
        onAddFloor={handleAddFloor}
      />

      <RoofModal
        isOpen={isRoofModalOpen}
        onClose={() => setIsRoofModalOpen(false)}
        floorId={activeFloor.id}
        existingRoof={activeFloor.roof}
        walls={activeFloor.walls}
        onSaveRoof={handleSaveRoof}
      />

      <CalibrateModal
        isOpen={calibModalData !== null}
        pixelDistance={calibModalData?.pixelDist ?? 0}
        onApply={handleApplyCalibration}
        onCancel={() => {
          setCalibModalData(null);
          setIsCalibrating(false);
        }}
      />

      <FurnitureCatalogModal
        isOpen={isFurnitureCatalogOpen}
        onSelect={(item) => {
          setActiveFurnitureCatalogId(item.id);
          setActiveTool('furniture');
          setIsFurnitureCatalogOpen(false);
          showToast({
            id: `toast_furn_${item.id}`,
            title: `Selected ${item.name}`,
            description: `Click on your 2D plan to place this ${item.category} fixture (${formatFeetInches(item.defaultDimensions.width)} × ${formatFeetInches(item.defaultDimensions.depth)}).`,
          });
        }}
        onClose={() => setIsFurnitureCatalogOpen(false)}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        settings={project.settings}
        onSave={handleUpdateProjectSettings}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <MaterialLibraryModal
        isOpen={isMaterialLibraryOpen}
        onClose={() => {
          setIsMaterialLibraryOpen(false);
          setMaterialTarget(null);
        }}
        onSelectMaterial={handleSelectMaterial}
        activeMaterialId={materialTarget?.currentMaterialId}
        targetDescription={materialTarget?.title}
      />

      <FlooringModal
        isOpen={isFlooringModalOpen}
        onClose={() => {
          setIsFlooringModalOpen(false);
          setFlooringModalRoomId(null);
        }}
        project={project}
        targetRoomId={flooringModalRoomId || undefined}
        onApplyRoomFlooring={handleApplyRoomFlooring}
        onApplyFloorFlooringBatch={handleApplyFloorFlooringBatch}
      />

      <ExportPlanModal
        isOpen={isExportPlanOpen}
        onClose={() => setIsExportPlanOpen(false)}
        project={project}
      />

      <AreaScheduleModal
        isOpen={isAreaScheduleOpen}
        onClose={() => setIsAreaScheduleOpen(false)}
        project={project}
        onRenameRoom={(floorId, roomId, newName) => {
          const floor = project.floors.find((f) => f.id === floorId);
          const room = floor?.rooms.find((r) => r.id === roomId);
          if (room) {
            historyRef.current.execute(
              new UpdateRoomCommand(floorId, { ...room, name: newName })
            );
          }
        }}
      />

      <CostEstimatorModal
        isOpen={isCostEstimatorOpen}
        onClose={() => setIsCostEstimatorOpen(false)}
        project={project}
      />

      <ElevationViewModal
        isOpen={isElevationViewOpen}
        onClose={() => setIsElevationViewOpen(false)}
        project={project}
        selectedRoomId={selectedRoomId}
      />

      <SectionViewModal
        isOpen={isSectionViewOpen}
        onClose={() => setIsSectionViewOpen(false)}
        project={project}
        sectionCut={activeFloor.sections?.find((s) => s.id === selectedSectionId) || activeFloor.sections?.[0]}
      />

      <SitePlanModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        project={project}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        onAddOutdoorFeature={handleAddOutdoorFeature}
        onDeleteOutdoorFeature={handleDeleteOutdoorFeature}
        onUpdateTimeOfDay={handleUpdateTimeOfDay}
      />

      <KitchenStudioModal
        isOpen={isKitchenStudioOpen}
        onClose={() => setIsKitchenStudioOpen(false)}
        project={project}
        onAddKitchen={handleAddKitchen}
        onUpdateKitchen={handleUpdateKitchen}
        onDeleteKitchen={handleDeleteKitchen}
      />

      <VastuModal
        isOpen={isVastuModalOpen}
        onClose={() => setIsVastuModalOpen(false)}
        project={project}
        onToggleVastuGrid={handleToggleVastuGrid}
        onUpdateNorthOrientation={handleUpdateNorthOrientation}
      />

      <SmartPlanAssistantModal
        isOpen={isSmartPlanModalOpen}
        onClose={() => setIsSmartPlanModalOpen(false)}
        onApplyPlan={handleApplySmartPlan}
        activeFloorId={project.activeFloorId}
      />

      {/* Contextual Beginner Feature Toast */}
      <FeatureToast toast={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* Interactive First-Time Onboarding Tour */}
      <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}

export default App;
