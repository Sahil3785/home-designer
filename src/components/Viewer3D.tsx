import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Project, Wall, Staircase, Column, Roof, FurnitureInstance, SitePlan, OutdoorFeature, KitchenDesign } from '../core/model/types';
import { COUNTERTOP_PRESETS, CABINET_FINISH_PRESETS } from '../core/model/kitchen';
import {
  sixteenthsToThreeUnits,
  threeUnitsToSixteenths,
  Sixteenths,
  wallLength,
  wallAngle,
  computeRoofBounds,
  getStairUpperCutout,
  getOakFloorTexture,
  getMarbleFloorTexture,
  getWalnutFloorTexture,
  getTileFloorTexture,
  getPvcVinylTexture,
  getMatteConcreteTexture,
  FloorStyle,
} from '../core';
import { DEFAULT_MATERIALS } from '../core/model/defaults';
import { RenderStudioModal, RenderSettings } from './RenderStudioModal';

function createSkyDomeTexture(mode: 'daylight' | 'golden' | 'night'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);

  if (mode === 'daylight') {
    grad.addColorStop(0, '#0284c7');    // Deep clear sky
    grad.addColorStop(0.4, '#38bdf8');  // Azure blue
    grad.addColorStop(0.75, '#e0f2fe'); // Soft atmospheric haze
    grad.addColorStop(0.9, '#f8fafc');  // Bright horizon
    grad.addColorStop(1, '#94a3b8');    // Distant landscape
  } else if (mode === 'golden') {
    grad.addColorStop(0, '#431407');    // Dusk violet
    grad.addColorStop(0.3, '#c2410c');  // Vibrant sunset orange
    grad.addColorStop(0.65, '#f97316'); // Amber glow
    grad.addColorStop(0.85, '#fed7aa'); // Golden horizon
    grad.addColorStop(1, '#475569');    // Horizon ground
  } else {
    grad.addColorStop(0, '#020617');    // Deep midnight
    grad.addColorStop(0.5, '#0f172a');  // Slate night
    grad.addColorStop(0.85, '#1e293b'); // Horizon twilight
    grad.addColorStop(1, '#090d16');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function formatSunHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Builds 3D procedural site, lawn ground, swimming pools, decks, patios, driveways, trees, and fencing.
 */
function build3DSiteFeatures(site: SitePlan, siteGroup: THREE.Group, isNight: boolean = false) {
  const lotW = sixteenthsToThreeUnits(site.lotWidth);
  const lotD = sixteenthsToThreeUnits(site.lotDepth);

  // 1. Lawn Grass Terrain
  const grassGeo = new THREE.BoxGeometry(lotW, 0.22, lotD);
  const grassMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.9,
    metalness: 0.02,
  });
  const grassMesh = new THREE.Mesh(grassGeo, grassMat);
  grassMesh.position.set(0, -0.11, 0);
  grassMesh.receiveShadow = true;
  siteGroup.add(grassMesh);

  // 2. Outdoor Features
  for (const feat of site.features) {
    const fw = sixteenthsToThreeUnits(feat.width);
    const fd = sixteenthsToThreeUnits(feat.depth);
    const fh = sixteenthsToThreeUnits(feat.height || 16);
    const fx = sixteenthsToThreeUnits(feat.position.x);
    const fz = -sixteenthsToThreeUnits(feat.position.y);

    const featGroup = new THREE.Group();
    featGroup.position.set(fx, 0, fz);
    if (feat.rotation) {
      featGroup.rotation.y = -(feat.rotation * Math.PI) / 180;
    }

    switch (feat.type) {
      case 'pool': {
        const copingThick = 0.35;
        const copingGeo = new THREE.BoxGeometry(fw + copingThick * 2, 0.12, fd + copingThick * 2);
        const copingMat = new THREE.MeshStandardMaterial({
          color: '#e2e8f0',
          roughness: 0.5,
          metalness: 0.05,
        });
        const copingMesh = new THREE.Mesh(copingGeo, copingMat);
        copingMesh.position.set(0, 0.06, 0);
        copingMesh.receiveShadow = true;
        featGroup.add(copingMesh);

        const waterGeo = new THREE.BoxGeometry(fw, 0.06, fd);
        const waterMat = new THREE.MeshStandardMaterial({
          color: '#0284c7',
          roughness: 0.08,
          metalness: 0.25,
          transparent: true,
          opacity: 0.85,
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, 0.05, 0);
        waterMesh.receiveShadow = true;
        featGroup.add(waterMesh);

        if (isNight) {
          const poolLight = new THREE.PointLight('#38bdf8', 1.8, 12);
          poolLight.position.set(0, 0.2, 0);
          featGroup.add(poolLight);
        }
        break;
      }

      case 'deck': {
        const deckGeo = new THREE.BoxGeometry(fw, 0.18, fd);
        const deckMat = new THREE.MeshStandardMaterial({
          color: '#92400e',
          roughness: 0.65,
          metalness: 0.05,
        });
        const deckMesh = new THREE.Mesh(deckGeo, deckMat);
        deckMesh.position.set(0, 0.09, 0);
        deckMesh.castShadow = true;
        deckMesh.receiveShadow = true;
        featGroup.add(deckMesh);
        break;
      }

      case 'patio': {
        const patioGeo = new THREE.BoxGeometry(fw, 0.08, fd);
        const patioMat = new THREE.MeshStandardMaterial({
          color: '#d6d3d1',
          roughness: 0.75,
          metalness: 0.02,
        });
        const patioMesh = new THREE.Mesh(patioGeo, patioMat);
        patioMesh.position.set(0, 0.04, 0);
        patioMesh.receiveShadow = true;
        featGroup.add(patioMesh);
        break;
      }

      case 'driveway':
      case 'pathway': {
        const driveGeo = new THREE.BoxGeometry(fw, 0.05, fd);
        const driveMat = new THREE.MeshStandardMaterial({
          color: '#64748b',
          roughness: 0.82,
          metalness: 0.05,
        });
        const driveMesh = new THREE.Mesh(driveGeo, driveMat);
        driveMesh.position.set(0, 0.025, 0);
        driveMesh.receiveShadow = true;
        featGroup.add(driveMesh);
        break;
      }

      case 'fence': {
        const fenceGeo = new THREE.BoxGeometry(fw, fh, 0.15);
        const fenceMat = new THREE.MeshStandardMaterial({
          color: '#78350f',
          roughness: 0.7,
          metalness: 0.05,
        });
        const fenceMesh = new THREE.Mesh(fenceGeo, fenceMat);
        fenceMesh.position.set(0, fh / 2, 0);
        fenceMesh.castShadow = true;
        fenceMesh.receiveShadow = true;
        featGroup.add(fenceMesh);
        break;
      }

      case 'tree': {
        const treeType = feat.metadata?.treeType || 'oak';
        const trunkH = Math.max(1.8, fh * 0.45);
        const trunkR = 0.22;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 12);
        const trunkMat = new THREE.MeshStandardMaterial({
          color: '#78350f',
          roughness: 0.85,
          metalness: 0.02,
        });
        const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
        trunkMesh.position.set(0, trunkH / 2, 0);
        trunkMesh.castShadow = true;
        featGroup.add(trunkMesh);

        if (treeType === 'palm') {
          const crownH = trunkH + 0.3;
          for (let i = 0; i < 7; i++) {
            const leafGeo = new THREE.BoxGeometry(0.35, 0.05, 2.2);
            const leafMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.6 });
            const leafMesh = new THREE.Mesh(leafGeo, leafMat);
            leafMesh.position.set(0, crownH, 1.1);
            leafMesh.rotation.x = 0.35;
            const frondGroup = new THREE.Group();
            frondGroup.position.set(0, crownH, 0);
            frondGroup.rotation.y = (i * Math.PI * 2) / 7;
            frondGroup.add(leafMesh);
            frondGroup.castShadow = true;
            featGroup.add(frondGroup);
          }
        } else if (treeType === 'pine') {
          const coneH = (fh - trunkH) / 2.5;
          for (let c = 0; c < 3; c++) {
            const r = Math.max(0.8, (fw / 2) * (1 - c * 0.25));
            const coneGeo = new THREE.ConeGeometry(r, coneH * 1.3, 12);
            const coneMat = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.8 });
            const coneMesh = new THREE.Mesh(coneGeo, coneMat);
            coneMesh.position.set(0, trunkH + c * coneH * 0.85, 0);
            coneMesh.castShadow = true;
            featGroup.add(coneMesh);
          }
        } else {
          const canopyR = Math.max(1.2, fw / 2.5);
          const canopyGeo = new THREE.SphereGeometry(canopyR, 16, 12);
          const canopyMat = new THREE.MeshStandardMaterial({
            color: '#15803d',
            roughness: 0.78,
            metalness: 0.02,
          });
          const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
          canopyMesh.position.set(0, trunkH + canopyR * 0.8, 0);
          canopyMesh.castShadow = true;
          featGroup.add(canopyMesh);
        }
        break;
      }

      case 'shrub':
      case 'garden_bed': {
        const shrubGeo = new THREE.SphereGeometry(Math.max(0.6, fw / 3), 12, 10);
        const shrubMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 });
        const shrubMesh = new THREE.Mesh(shrubGeo, shrubMat);
        shrubMesh.position.set(0, 0.4, 0);
        shrubMesh.castShadow = true;
        featGroup.add(shrubMesh);
        break;
      }
    }

    siteGroup.add(featGroup);
  }
}

interface Viewer3DProps {
  project: Project;
  selectedWallId: string | null;
  onSelectWall?: (wallId: string | null) => void;
  showRoof?: boolean;
  onToggleShowRoof?: () => void;
  viewMode?: 'orbit' | 'walk';
  onToggleViewMode?: (mode: 'orbit' | 'walk') => void;
  onWalkCameraMove?: (cam: { x: Sixteenths; y: Sixteenths; yaw: number }) => void;
  onToggleDoorOpen?: (wallId: string, openingId: string) => void;
  onUpdate3D?: () => void;
}


/**
 * Builds procedural 3D solid geometry for modular kitchen cabinetry, countertops, appliances, and lighting.
 */
function build3DKitchenMesh(kitchen: KitchenDesign, floorElevUnits: number): THREE.Group {
  const group = new THREE.Group();
  const kx = sixteenthsToThreeUnits(kitchen.position.x);
  const kz = -sixteenthsToThreeUnits(kitchen.position.y);
  group.position.set(kx, floorElevUnits, kz);
  group.rotation.y = -(kitchen.rotation * Math.PI) / 180;

  const cabPreset = CABINET_FINISH_PRESETS[kitchen.cabinetFinish] || CABINET_FINISH_PRESETS.acrylic_white_gloss;
  const counterPreset = COUNTERTOP_PRESETS[kitchen.countertopMaterial] || COUNTERTOP_PRESETS.quartz_calacatta_white;

  const cabinetMat = new THREE.MeshStandardMaterial({
    color: cabPreset.color,
    roughness: cabPreset.roughness,
    metalness: cabPreset.metalness,
  });

  const toeKickMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.8,
    metalness: 0.1,
  });

  const counterMat = new THREE.MeshStandardMaterial({
    color: counterPreset.color,
    roughness: counterPreset.roughness,
    metalness: counterPreset.metalness,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color:
      kitchen.handleStyle === 'brushed_brass_bar'
        ? '#eab308'
        : kitchen.handleStyle === 'matte_black_pull'
        ? '#18181b'
        : '#cbd5e1',
    roughness: 0.25,
    metalness: 0.85,
  });

  const stainlessMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.2,
    metalness: 0.85,
  });

  const glassHobMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.1,
    metalness: 0.3,
  });

  const underCabinetLightMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#fef08a',
    emissiveIntensity: 0.75,
  });

  for (const cab of kitchen.cabinets) {
    const isBase = cab.type.startsWith('base') || cab.type === 'island_base';
    const cw = sixteenthsToThreeUnits(cab.width);
    const cd = sixteenthsToThreeUnits(cab.depth);
    const ch = sixteenthsToThreeUnits(cab.height);
    const ce = sixteenthsToThreeUnits(cab.elevation);
    const cx = sixteenthsToThreeUnits(cab.position.x);
    const cz = -sixteenthsToThreeUnits(cab.position.y);

    const cabGroup = new THREE.Group();
    cabGroup.position.set(cx, ce, cz);
    if (cab.rotation) {
      cabGroup.rotation.y = -(cab.rotation * Math.PI) / 180;
    }

    if (isBase) {
      // 1. Recessed Toe Kick
      const toeH = 0.08;
      const toeRecess = 0.04;
      const toeGeo = new THREE.BoxGeometry(cw, toeH, cd - toeRecess);
      const toeMesh = new THREE.Mesh(toeGeo, toeKickMat);
      toeMesh.position.set(0, toeH / 2, -toeRecess / 2);
      toeMesh.castShadow = true;
      toeMesh.receiveShadow = true;
      cabGroup.add(toeMesh);

      // 2. Base Cabinet Carcass
      const carcassH = ch - toeH - 0.035;
      const carcassGeo = new THREE.BoxGeometry(cw, carcassH, cd);
      const carcassMesh = new THREE.Mesh(carcassGeo, cabinetMat);
      carcassMesh.position.set(0, toeH + carcassH / 2, 0);
      carcassMesh.castShadow = true;
      carcassMesh.receiveShadow = true;
      cabGroup.add(carcassMesh);

      // 3. Countertop Slab on top
      const counterThick = 0.035;
      const counterOverhang = 0.02;
      const counterGeo = new THREE.BoxGeometry(cw, counterThick, cd + counterOverhang);
      const counterMesh = new THREE.Mesh(counterGeo, counterMat);
      counterMesh.position.set(0, ch - counterThick / 2, counterOverhang / 2);
      counterMesh.castShadow = true;
      counterMesh.receiveShadow = true;
      cabGroup.add(counterMesh);

      // 4. Handles on front
      const handleGeo = new THREE.BoxGeometry(cw * 0.4, 0.015, 0.02);
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, ch * 0.75, cd / 2 + 0.01);
      cabGroup.add(handleMesh);
    } else {
      // Wall Cabinet (Overhead)
      const carcassGeo = new THREE.BoxGeometry(cw, ch, cd);
      const carcassMesh = new THREE.Mesh(carcassGeo, cabinetMat);
      carcassMesh.position.set(0, ch / 2, 0);
      carcassMesh.castShadow = true;
      carcassMesh.receiveShadow = true;
      cabGroup.add(carcassMesh);

      // Handle
      const handleGeo = new THREE.BoxGeometry(cw * 0.35, 0.012, 0.015);
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0.04, cd / 2 + 0.01);
      cabGroup.add(handleMesh);

      // Under-cabinet LED Strip Glow
      if (kitchen.hasUnderCabinetLighting) {
        const ledGeo = new THREE.BoxGeometry(cw * 0.9, 0.008, cd * 0.4);
        const ledMesh = new THREE.Mesh(ledGeo, underCabinetLightMat);
        ledMesh.position.set(0, -0.004, 0);
        cabGroup.add(ledMesh);
      }
    }

    group.add(cabGroup);
  }

  // Built-in Appliances
  for (const app of kitchen.appliances) {
    const ax = sixteenthsToThreeUnits(app.position.x);
    const az = -sixteenthsToThreeUnits(app.position.y);
    const ae = sixteenthsToThreeUnits(app.elevation);
    const aw = sixteenthsToThreeUnits(app.width);
    const ad = sixteenthsToThreeUnits(app.depth);
    const ah = sixteenthsToThreeUnits(app.height);

    const appGroup = new THREE.Group();
    appGroup.position.set(ax, ae, az);
    if (app.rotation) {
      appGroup.rotation.y = -(app.rotation * Math.PI) / 180;
    }

    if (app.type.includes('sink')) {
      const rimGeo = new THREE.BoxGeometry(aw, 0.015, ad);
      const rimMesh = new THREE.Mesh(rimGeo, stainlessMat);
      rimMesh.position.set(0, 0.005, 0);
      appGroup.add(rimMesh);

      const faucetBaseGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8);
      const faucetBase = new THREE.Mesh(faucetBaseGeo, stainlessMat);
      faucetBase.position.set(0, 0.03, -ad / 2 + 0.03);
      appGroup.add(faucetBase);

      const spoutGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
      const spout = new THREE.Mesh(spoutGeo, stainlessMat);
      spout.position.set(0, 0.08, -ad / 2 + 0.05);
      spout.rotation.y = Math.PI / 2;
      appGroup.add(spout);
    } else if (app.type.includes('hob')) {
      const hobGeo = new THREE.BoxGeometry(aw, 0.015, ad);
      const hobMesh = new THREE.Mesh(hobGeo, glassHobMat);
      hobMesh.position.set(0, 0.008, 0);
      appGroup.add(hobMesh);

      const burnerGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.01, 12);
      const burnerMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5, metalness: 0.8 });
      for (let bi = -1; bi <= 1; bi += 2) {
        for (let bj = -1; bj <= 1; bj += 2) {
          const bMesh = new THREE.Mesh(burnerGeo, burnerMat);
          bMesh.position.set(bi * aw * 0.22, 0.018, bj * ad * 0.22);
          appGroup.add(bMesh);
        }
      }
    } else if (app.type === 'chimney_hood') {
      const hoodBaseGeo = new THREE.BoxGeometry(aw, 0.04, ad);
      const hoodBase = new THREE.Mesh(hoodBaseGeo, stainlessMat);
      hoodBase.position.set(0, 0.02, 0);
      appGroup.add(hoodBase);

      const ductGeo = new THREE.BoxGeometry(aw * 0.4, ah, ad * 0.4);
      const ductMesh = new THREE.Mesh(ductGeo, stainlessMat);
      ductMesh.position.set(0, ah / 2, 0);
      appGroup.add(ductMesh);
    }

    group.add(appGroup);
  }

  return group;
}

/**
 * Builds procedural 3D solid meshes for architectural furniture & built-in fixtures.
 */
function build3DFurnitureMesh(furn: FurnitureInstance, floorElevUnits: number): THREE.Group {
  const group = new THREE.Group();
  const w = sixteenthsToThreeUnits(furn.dimensions.width);
  const d = sixteenthsToThreeUnits(furn.dimensions.depth);
  const h = sixteenthsToThreeUnits(furn.dimensions.height);

  const x = sixteenthsToThreeUnits(furn.position.x);
  const z = -sixteenthsToThreeUnits(furn.position.y);
  const y = floorElevUnits + sixteenthsToThreeUnits(furn.position.z);

  group.position.set(x, y, z);
  group.rotation.y = -furn.rotation;

  // Shared professional architectural PBR materials
  const oakMat = new THREE.MeshStandardMaterial({ color: '#a67c52', roughness: 0.55, metalness: 0.05 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#543d2b', roughness: 0.6, metalness: 0.05 });
  const linenMat = new THREE.MeshStandardMaterial({ color: '#dcd4c7', roughness: 0.82, metalness: 0.02 });
  const linenCharcoalMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85, metalness: 0.05 });
  const pillowIvoryMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9, metalness: 0.0 });
  const pillowAccentMat = new THREE.MeshStandardMaterial({ color: '#c26d24', roughness: 0.85, metalness: 0.05 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.15, metalness: 0.05 });
  const navyCabinetMat = new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.45, metalness: 0.05 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.25, metalness: 0.85 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.2, metalness: 0.85 });
  const blackSteelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.8 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08, metalness: 0.02 });
  const lampWarmMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fde68a', emissiveIntensity: 0.65 });
  const pavingMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.9, metalness: 0.05 });

  if (furn.catalogId === 'wardrobe_built_in') {
    // Plinth base
    const plinthGeo = new THREE.BoxGeometry(w, 0.08, d);
    const plinthMesh = new THREE.Mesh(plinthGeo, darkWoodMat);
    plinthMesh.position.set(0, 0.04, 0);
    group.add(plinthMesh);

    // Main carcass with fluted oak center doors and white outer frames
    const carcassGeo = new THREE.BoxGeometry(w, h - 0.08, d);
    const carcassMesh = new THREE.Mesh(carcassGeo, porcelainMat);
    carcassMesh.position.set(0, 0.08 + (h - 0.08) / 2, 0);
    carcassMesh.castShadow = true;
    carcassMesh.receiveShadow = true;
    group.add(carcassMesh);

    // Fluted wood center accent panel
    const accentGeo = new THREE.BoxGeometry(w * 0.6, h - 0.24, 0.02);
    const accentMesh = new THREE.Mesh(accentGeo, oakMat);
    accentMesh.position.set(0, 0.08 + (h - 0.08) / 2, d / 2 + 0.01);
    group.add(accentMesh);

    // Vertical door seam line
    const seamGeo = new THREE.BoxGeometry(0.015, h - 0.16, 0.03);
    const seamMesh = new THREE.Mesh(seamGeo, blackSteelMat);
    seamMesh.position.set(0, 0.08 + (h - 0.08) / 2, d / 2 + 0.015);
    group.add(seamMesh);

    // Elegant tall brushed brass handles
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.65, 8);
    const h1 = new THREE.Mesh(handleGeo, brassMat);
    h1.position.set(-0.05, h / 2, d / 2 + 0.03);
    const h2 = new THREE.Mesh(handleGeo, brassMat);
    h2.position.set(0.05, h / 2, d / 2 + 0.03);
    group.add(h1);
    group.add(h2);
  } else if (furn.catalogId === 'bed_king' || furn.catalogId === 'bed_queen') {
    const isKing = furn.catalogId === 'bed_king';

    // 4 Corner Tapered Wooden Legs
    const legH = 0.14;
    const legGeo = new THREE.CylinderGeometry(0.035, 0.025, legH, 12);
    const legOffsets: [number, number][] = [
      [-w / 2 + 0.08, -d / 2 + 0.08],
      [w / 2 - 0.08, -d / 2 + 0.08],
      [-w / 2 + 0.08, d / 2 - 0.08],
      [w / 2 - 0.08, d / 2 - 0.08],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, oakMat);
      leg.position.set(lx, legH / 2, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Solid Oak Platform Bed Frame
    const frameGeo = new THREE.BoxGeometry(w, 0.18, d);
    const frameMesh = new THREE.Mesh(frameGeo, oakMat);
    frameMesh.position.set(0, legH + 0.09, 0);
    frameMesh.castShadow = true;
    group.add(frameMesh);

    // Tufted Padded Upholstered Headboard
    const headH = Math.max(h, 0.95);
    const headGeo = new THREE.BoxGeometry(w + 0.08, headH, 0.16);
    const headMesh = new THREE.Mesh(headGeo, linenCharcoalMat);
    headMesh.position.set(0, headH / 2, -d / 2 + 0.08);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Headboard Horizontal Channel Tufting lines
    for (let c = 1; c <= 2; c++) {
      const lineGeo = new THREE.BoxGeometry(w + 0.09, 0.015, 0.17);
      const lineMesh = new THREE.Mesh(lineGeo, darkWoodMat);
      lineMesh.position.set(0, headH * (c / 3), -d / 2 + 0.08);
      group.add(lineMesh);
    }

    // Thick Plush Mattress
    const matGeo = new THREE.BoxGeometry(w - 0.12, 0.32, d - 0.22);
    const matMesh = new THREE.Mesh(matGeo, porcelainMat);
    matMesh.position.set(0, legH + 0.18 + 0.16, 0.08);
    matMesh.castShadow = true;
    group.add(matMesh);

    // Layered Folded Duvet Comforter
    const duvetGeo = new THREE.BoxGeometry(w - 0.1, 0.34, (d - 0.22) * 0.62);
    const duvetMesh = new THREE.Mesh(duvetGeo, linenMat);
    duvetMesh.position.set(0, legH + 0.18 + 0.17, 0.32);
    duvetMesh.castShadow = true;
    group.add(duvetMesh);

    // Plump Sleeping Pillows (2 Rows of 2)
    const pillowGeo = new THREE.BoxGeometry((w - 0.35) / 2, 0.14, 0.32);
    for (let row = 0; row < 2; row++) {
      const zPos = -d / 2 + 0.32 + row * 0.18;
      const yPos = legH + 0.34 + 0.08 + row * 0.04;
      const p1 = new THREE.Mesh(pillowGeo, row === 0 ? pillowIvoryMat : linenMat);
      p1.position.set(-(w / 4), yPos, zPos);
      p1.castShadow = true;
      group.add(p1);

      const p2 = new THREE.Mesh(pillowGeo, row === 0 ? pillowIvoryMat : linenMat);
      p2.position.set(w / 4, yPos, zPos);
      p2.castShadow = true;
      group.add(p2);
    }

    // Decorative Lumbar Throw Pillow
    const lumbarGeo = new THREE.BoxGeometry(w * 0.35, 0.12, 0.18);
    const lumbarMesh = new THREE.Mesh(lumbarGeo, pillowAccentMat);
    lumbarMesh.position.set(0, legH + 0.44, -d / 2 + 0.65);
    group.add(lumbarMesh);

    // Nightstands & Bedside Lamps (for King Bed)
    if (isKing) {
      const standW = 0.45;
      const standH = 0.42;
      const standD = 0.4;
      const standGeo = new THREE.BoxGeometry(standW, standH, standD);

      const standPositions = [
        -w / 2 - standW / 2 - 0.06,
        w / 2 + standW / 2 + 0.06,
      ];

      standPositions.forEach((sx) => {
        const stand = new THREE.Mesh(standGeo, oakMat);
        stand.position.set(sx, standH / 2, -d / 2 + standD / 2);
        stand.castShadow = true;
        group.add(stand);

        // Bedside Table Lamp: Base + Stem + Shade
        const lampBaseGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
        const lampBase = new THREE.Mesh(lampBaseGeo, brassMat);
        lampBase.position.set(sx, standH + 0.01, -d / 2 + standD / 2);
        group.add(lampBase);

        const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
        const stem = new THREE.Mesh(stemGeo, brassMat);
        stem.position.set(sx, standH + 0.15, -d / 2 + standD / 2);
        group.add(stem);

        const shadeGeo = new THREE.CylinderGeometry(0.09, 0.14, 0.18, 16);
        const shade = new THREE.Mesh(shadeGeo, lampWarmMat);
        shade.position.set(sx, standH + 0.32, -d / 2 + standD / 2);
        group.add(shade);
      });
    }
  } else if (furn.catalogId === 'sofa_3_seater' || furn.catalogId === 'sofa_armchair') {
    const is3Seater = furn.catalogId === 'sofa_3_seater';
    const legH = 0.14;

    // Splayed Tapered Wooden Legs
    const legGeo = new THREE.CylinderGeometry(0.026, 0.016, legH, 12);
    const legX = w / 2 - 0.12;
    const legZ = d / 2 - 0.12;
    const legCoords: [number, number, number, number][] = [
      [-legX, -legZ, 0.12, -0.12],
      [legX, -legZ, 0.12, 0.12],
      [-legX, legZ, -0.12, -0.12],
      [legX, legZ, -0.12, 0.12],
    ];
    legCoords.forEach(([lx, lz, rotX, rotZ]) => {
      const leg = new THREE.Mesh(legGeo, oakMat);
      leg.position.set(lx, legH / 2, lz);
      leg.rotation.set(rotX, 0, rotZ);
      leg.castShadow = true;
      group.add(leg);
    });

    // Solid Wood Perimeter Base Rail
    const railGeo = new THREE.BoxGeometry(w * 0.95, 0.05, d * 0.9);
    const railMesh = new THREE.Mesh(railGeo, oakMat);
    railMesh.position.set(0, legH + 0.025, 0);
    railMesh.castShadow = true;
    group.add(railMesh);

    // Main Upholstered Chassis (Seat Deck)
    const deckH = 0.16;
    const deckGeo = new THREE.BoxGeometry(w, deckH, d * 0.92);
    const deckMesh = new THREE.Mesh(deckGeo, linenMat);
    deckMesh.position.set(0, legH + 0.05 + deckH / 2, 0);
    deckMesh.castShadow = true;
    group.add(deckMesh);

    // Padded Backrest Support Frame
    const backH = h - legH - deckH - 0.05;
    const backGeo = new THREE.BoxGeometry(w, backH, 0.18);
    const backMesh = new THREE.Mesh(backGeo, linenMat);
    backMesh.position.set(0, legH + deckH + backH / 2, -d / 2 + 0.09);
    backMesh.castShadow = true;
    group.add(backMesh);

    // Left and Right Ergonomic Contoured Armrests
    const armW = 0.18;
    const armH = backH * 0.72;
    const armGeo = new THREE.BoxGeometry(armW, armH, d * 0.92);

    const leftArm = new THREE.Mesh(armGeo, linenMat);
    leftArm.position.set(-w / 2 + armW / 2, legH + deckH + armH / 2, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, linenMat);
    rightArm.position.set(w / 2 - armW / 2, legH + deckH + armH / 2, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Plush Sculpted Seat Cushions
    const seatUsableW = w - armW * 2 - 0.04;
    const numCushions = is3Seater ? 3 : 1;
    const cushionW = seatUsableW / numCushions;
    const cushionGeo = new THREE.BoxGeometry(cushionW - 0.02, 0.14, d * 0.7);

    for (let i = 0; i < numCushions; i++) {
      const cx = -seatUsableW / 2 + cushionW * (i + 0.5);
      const cushion = new THREE.Mesh(cushionGeo, linenMat);
      cushion.position.set(cx, legH + deckH + 0.07, 0.06);
      cushion.castShadow = true;
      group.add(cushion);
    }

    // Plush Tufted Backrest Cushions (Pillowy & Angled)
    const backCushionGeo = new THREE.BoxGeometry(cushionW - 0.02, backH * 0.88, 0.14);
    for (let i = 0; i < numCushions; i++) {
      const cx = -seatUsableW / 2 + cushionW * (i + 0.5);
      const backCushion = new THREE.Mesh(backCushionGeo, linenMat);
      backCushion.position.set(cx, legH + deckH + (backH * 0.88) / 2 + 0.04, -d / 2 + 0.22);
      backCushion.rotation.x = 0.08; // subtle relaxed recline
      backCushion.castShadow = true;
      group.add(backCushion);
    }

    // Designer Throw Pillows for 3-Seater Sofa
    if (is3Seater) {
      const pillowGeo = new THREE.BoxGeometry(0.24, 0.24, 0.1);

      // Left ivory pillow
      const pLeft = new THREE.Mesh(pillowGeo, pillowIvoryMat);
      pLeft.position.set(-w / 2 + armW + 0.12, legH + deckH + 0.2, -d * 0.08);
      pLeft.rotation.set(0.1, 0.35, 0.15);
      pLeft.castShadow = true;
      group.add(pLeft);

      // Right terracotta accent pillow
      const pRight = new THREE.Mesh(pillowGeo, pillowAccentMat);
      pRight.position.set(w / 2 - armW - 0.12, legH + deckH + 0.2, -d * 0.08);
      pRight.rotation.set(0.1, -0.35, -0.15);
      pRight.castShadow = true;
      group.add(pRight);
    }
  } else if (furn.catalogId === 'coffee_table') {
    // Natural Oak Coffee Table with Tapered Legs & Magazine Shelf
    const topThick = 0.04;
    const legH = h - topThick;

    // Tabletop with beveled edge
    const topGeo = new THREE.BoxGeometry(w, topThick, d);
    const topMesh = new THREE.Mesh(topGeo, oakMat);
    topMesh.position.set(0, h - topThick / 2, 0);
    topMesh.castShadow = true;
    group.add(topMesh);

    // 4 Splayed Tapered Wooden Legs
    const legGeo = new THREE.CylinderGeometry(0.024, 0.016, legH, 12);
    const lx = w / 2 - 0.08;
    const lz = d / 2 - 0.08;
    const legOffsets: [number, number, number, number][] = [
      [-lx, -lz, 0.08, -0.08],
      [lx, -lz, 0.08, 0.08],
      [-lx, lz, -0.08, -0.08],
      [lx, lz, -0.08, 0.08],
    ];
    legOffsets.forEach(([xOff, zOff, rx, rz]) => {
      const leg = new THREE.Mesh(legGeo, oakMat);
      leg.position.set(xOff, legH / 2, zOff);
      leg.rotation.set(rx, 0, rz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Lower Slatted Shelf
    const shelfGeo = new THREE.BoxGeometry(w * 0.78, 0.02, d * 0.72);
    const shelfMesh = new THREE.Mesh(shelfGeo, darkWoodMat);
    shelfMesh.position.set(0, legH * 0.35, 0);
    group.add(shelfMesh);

    // Table Accessories: Art Book and Ceramic Stoneware Bowl
    const bookGeo = new THREE.BoxGeometry(0.24, 0.03, 0.18);
    const bookMesh = new THREE.Mesh(bookGeo, porcelainMat);
    bookMesh.position.set(w * 0.15, h + 0.015, 0);
    bookMesh.rotation.y = 0.2;
    group.add(bookMesh);

    const vaseGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.14, 16);
    const vaseMesh = new THREE.Mesh(vaseGeo, pillowIvoryMat);
    vaseMesh.position.set(-w * 0.2, h + 0.07, 0);
    group.add(vaseMesh);
  } else if (furn.catalogId === 'dining_6_seater' || furn.catalogId === 'dining_4_seater') {
    const is6 = furn.catalogId === 'dining_6_seater';
    const topThick = 0.05;
    const legH = h - topThick;

    // Solid Oak Dining Tabletop
    const topGeo = new THREE.BoxGeometry(w * 0.85, topThick, d * 0.78);
    const topMesh = new THREE.Mesh(topGeo, oakMat);
    topMesh.position.set(0, h - topThick / 2, 0);
    topMesh.castShadow = true;
    group.add(topMesh);

    // 4 Sturdy Tapered Oak Legs
    const legGeo = new THREE.CylinderGeometry(0.032, 0.022, legH, 12);
    const lx = (w * 0.85) / 2 - 0.08;
    const lz = (d * 0.78) / 2 - 0.08;
    [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(([xOff, zOff]) => {
      const leg = new THREE.Mesh(legGeo, oakMat);
      leg.position.set(xOff, legH / 2, zOff);
      leg.castShadow = true;
      group.add(leg);
    });

    // Designer Dining Chairs tucked around table
    const chairPositions: [number, number, number][] = is6
      ? [
          [-w * 0.26, -d * 0.44, 0],
          [w * 0.26, -d * 0.44, 0],
          [-w * 0.26, d * 0.44, Math.PI],
          [w * 0.26, d * 0.44, Math.PI],
          [-w * 0.46, 0, Math.PI / 2],
          [w * 0.46, 0, -Math.PI / 2],
        ]
      : [
          [-w * 0.22, -d * 0.42, 0],
          [w * 0.22, -d * 0.42, 0],
          [-w * 0.22, d * 0.42, Math.PI],
          [w * 0.22, d * 0.42, Math.PI],
        ];

    chairPositions.forEach(([cx, cz, rot]) => {
      const chair = new THREE.Group();
      chair.position.set(cx, 0, cz);
      chair.rotation.y = rot;

      // Chair Legs
      const cLegGeo = new THREE.CylinderGeometry(0.016, 0.012, 0.44, 8);
      [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([clx, clz]) => {
        const cLeg = new THREE.Mesh(cLegGeo, oakMat);
        cLeg.position.set(clx, 0.22, clz);
        chair.add(cLeg);
      });

      // Upholstered Seat Cushion
      const cSeatGeo = new THREE.BoxGeometry(0.38, 0.06, 0.38);
      const cSeat = new THREE.Mesh(cSeatGeo, linenMat);
      cSeat.position.set(0, 0.45, 0);
      cSeat.castShadow = true;
      chair.add(cSeat);

      // Ergonomic Curved Backrest
      const cBackGeo = new THREE.BoxGeometry(0.38, 0.38, 0.05);
      const cBack = new THREE.Mesh(cBackGeo, linenMat);
      cBack.position.set(0, 0.64, -0.16);
      cBack.rotation.x = 0.06;
      cBack.castShadow = true;
      chair.add(cBack);

      group.add(chair);
    });

    // Decorative Centerpiece Vase
    const centerVaseGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.18, 16);
    const centerVase = new THREE.Mesh(centerVaseGeo, porcelainMat);
    centerVase.position.set(0, h + 0.09, 0);
    group.add(centerVase);
  } else if (furn.catalogId === 'kitchen_counter_sink') {
    // Navy Shaker Base Cabinet
    const cabH = h - 0.08;
    const cabGeo = new THREE.BoxGeometry(w, cabH, d);
    const cabMesh = new THREE.Mesh(cabGeo, navyCabinetMat);
    cabMesh.position.set(0, cabH / 2, 0);
    cabMesh.castShadow = true;
    group.add(cabMesh);

    // Brushed Brass Handles
    const numDoors = 4;
    const doorW = w / numDoors;
    for (let i = 0; i < numDoors; i++) {
      const hx = -w / 2 + doorW * (i + 0.5);
      const bHandleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8);
      const bHandle = new THREE.Mesh(bHandleGeo, brassMat);
      bHandle.rotation.z = Math.PI / 2;
      bHandle.position.set(hx, cabH * 0.7, d / 2 + 0.02);
      group.add(bHandle);
    }

    // Calacatta White Marble Countertop with Backsplash
    const topGeo = new THREE.BoxGeometry(w + 0.04, 0.08, d + 0.04);
    const topMesh = new THREE.Mesh(topGeo, marbleMat);
    topMesh.position.set(0, h - 0.04, 0);
    topMesh.castShadow = true;
    group.add(topMesh);

    const splashGeo = new THREE.BoxGeometry(w + 0.04, 0.14, 0.03);
    const splashMesh = new THREE.Mesh(splashGeo, marbleMat);
    splashMesh.position.set(0, h + 0.07, -d / 2 - 0.01);
    group.add(splashMesh);

    // Undermount Stainless Steel Double Sink Basin
    const sinkGeo = new THREE.BoxGeometry(w * 0.32, 0.03, d * 0.58);
    const sinkMesh = new THREE.Mesh(sinkGeo, chromeMat);
    sinkMesh.position.set(-w * 0.15, h + 0.01, 0);
    group.add(sinkMesh);

    // Arched Chrome Gooseneck Faucet
    const faucetGroup = new THREE.Group();
    faucetGroup.position.set(-w * 0.15, h + 0.02, -d * 0.22);
    const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), chromeMat);
    faucetBase.position.y = 0.02;
    faucetGroup.add(faucetBase);

    const spoutPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 12), chromeMat);
    spoutPipe.position.set(0, 0.16, 0);
    faucetGroup.add(spoutPipe);

    const spoutArch = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.12), chromeMat);
    spoutArch.position.set(0, 0.3, 0.05);
    faucetGroup.add(spoutArch);
    group.add(faucetGroup);
  } else if (furn.catalogId === 'kitchen_stove_unit') {
    // Navy Shaker Base Cabinet
    const cabH = h - 0.08;
    const cabGeo = new THREE.BoxGeometry(w, cabH, d);
    const cabMesh = new THREE.Mesh(cabGeo, navyCabinetMat);
    cabMesh.position.set(0, cabH / 2, 0);
    cabMesh.castShadow = true;
    group.add(cabMesh);

    // Calacatta Marble Countertop with Backsplash
    const topGeo = new THREE.BoxGeometry(w + 0.04, 0.08, d + 0.04);
    const topMesh = new THREE.Mesh(topGeo, marbleMat);
    topMesh.position.set(0, h - 0.04, 0);
    topMesh.castShadow = true;
    group.add(topMesh);

    const splashGeo = new THREE.BoxGeometry(w + 0.04, 0.14, 0.03);
    const splashMesh = new THREE.Mesh(splashGeo, marbleMat);
    splashMesh.position.set(0, h + 0.07, -d / 2 - 0.01);
    group.add(splashMesh);

    // Black Tempered Glass Cooktop Plate
    const hobGeo = new THREE.BoxGeometry(w * 0.82, 0.015, d * 0.72);
    const hobMesh = new THREE.Mesh(hobGeo, blackSteelMat);
    hobMesh.position.set(0, h + 0.01, 0);
    group.add(hobMesh);

    // 4 Burner Rings & Cast Iron Trivets
    const burnerGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16);
    const bOffsets: [number, number][] = [
      [-w * 0.22, -d * 0.18],
      [w * 0.22, -d * 0.18],
      [-w * 0.22, d * 0.18],
      [w * 0.22, d * 0.18],
    ];
    bOffsets.forEach(([bx, bz]) => {
      const b = new THREE.Mesh(burnerGeo, blackSteelMat);
      b.position.set(bx, h + 0.025, bz);
      group.add(b);
    });

    // Rotary Control Knobs
    for (let k = 0; k < 4; k++) {
      const kx = -w * 0.24 + k * (w * 0.16);
      const knobGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12);
      const knob = new THREE.Mesh(knobGeo, chromeMat);
      knob.position.set(kx, h + 0.02, d * 0.32);
      group.add(knob);
    }
  } else if (furn.catalogId === 'toilet_commode') {
    // Vitreous China One-Piece Toilet Commode
    const bowlH = 0.44;
    const bowlGeo = new THREE.BoxGeometry(w * 0.88, bowlH, d * 0.62);
    const bowlMesh = new THREE.Mesh(bowlGeo, porcelainMat);
    bowlMesh.position.set(0, bowlH / 2, d * 0.14);
    bowlMesh.castShadow = true;
    group.add(bowlMesh);

    // Contoured Soft-Close Seat Lid
    const lidGeo = new THREE.BoxGeometry(w * 0.86, 0.035, d * 0.58);
    const lidMesh = new THREE.Mesh(lidGeo, porcelainMat);
    lidMesh.position.set(0, bowlH + 0.02, d * 0.15);
    group.add(lidMesh);

    // Cistern Tank
    const tankH = h - 0.08;
    const tankGeo = new THREE.BoxGeometry(w * 0.94, tankH, d * 0.32);
    const tankMesh = new THREE.Mesh(tankGeo, porcelainMat);
    tankMesh.position.set(0, tankH / 2, -d * 0.3);
    tankMesh.castShadow = true;
    group.add(tankMesh);

    // Chrome Dual Flush Button on Tank Top
    const flushBtnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
    const flushBtn = new THREE.Mesh(flushBtnGeo, chromeMat);
    flushBtn.position.set(0, tankH + 0.01, -d * 0.3);
    group.add(flushBtn);
  } else if (furn.catalogId === 'washbasin_vanity') {
    // Ultra-Luxury Italian Floating Vanity Suite
    const cabH = h * 0.52;
    const cabY = h * 0.42;
    const cabD = d * 0.95;

    // 1. Floating Walnut Cabinet Carcass
    const cabGeo = new THREE.BoxGeometry(w, cabH, cabD);
    const cabMesh = new THREE.Mesh(cabGeo, darkWoodMat);
    cabMesh.position.set(0, cabY, 0);
    cabMesh.castShadow = true;
    cabMesh.receiveShadow = true;
    group.add(cabMesh);

    // 2. Dual Fluted Drawer Faces
    const drawerH = (cabH - 0.05) / 2;
    for (let dr = 0; dr < 2; dr++) {
      const dry = cabY - cabH / 2 + drawerH / 2 + dr * (drawerH + 0.02) + 0.015;
      const dFaceGeo = new THREE.BoxGeometry(w * 0.98, drawerH, 0.02);
      const dFace = new THREE.Mesh(dFaceGeo, oakMat);
      dFace.position.set(0, dry, cabD / 2 + 0.01);
      group.add(dFace);

      // Recessed Champagne Brass Shadowline Channel / Pull
      const pullGeo = new THREE.BoxGeometry(w * 0.55, 0.015, 0.025);
      const pull = new THREE.Mesh(pullGeo, brassMat);
      pull.position.set(0, dry + drawerH * 0.35, cabD / 2 + 0.02);
      group.add(pull);
    }

    // 3. Thick 45mm Polished Calacatta Gold Marble Countertop
    const topThick = 0.045;
    const topW = w + 0.04;
    const topD = cabD + 0.04;
    const topGeo = new THREE.BoxGeometry(topW, topThick, topD);
    const topMesh = new THREE.Mesh(topGeo, marbleMat);
    topMesh.position.set(0, cabY + cabH / 2 + topThick / 2, 0.01);
    topMesh.castShadow = true;
    group.add(topMesh);

    // 4. Low Marble Backsplash against wall
    const splashH = 0.08;
    const splashGeo = new THREE.BoxGeometry(topW, splashH, 0.02);
    const splashMesh = new THREE.Mesh(splashGeo, marbleMat);
    splashMesh.position.set(0, cabY + cabH / 2 + topThick + splashH / 2, -cabD / 2 - 0.01);
    group.add(splashMesh);

    // 5. Sculpted Curved Ceramic Vessel Sink Bowl
    const basinW = w * 0.62;
    const basinD = cabD * 0.65;
    const basinH = 0.14;
    const rimGeo = new THREE.CylinderGeometry(basinW / 2, basinW * 0.42, basinH, 32);
    rimGeo.scale(1, 1, basinD / basinW); // Oval scaling
    const basinMesh = new THREE.Mesh(rimGeo, porcelainMat);
    basinMesh.position.set(0, cabY + cabH / 2 + topThick + basinH / 2, 0.02);
    basinMesh.castShadow = true;
    group.add(basinMesh);

    // Chrome Pop-up Drain Stopper inside basin
    const drainGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.015, 16);
    const drainMesh = new THREE.Mesh(drainGeo, chromeMat);
    drainMesh.position.set(0, cabY + cabH / 2 + topThick + basinH * 0.2, 0.02);
    group.add(drainMesh);

    // 6. High-Arc Curved Champagne Brass Swan Faucet
    const faucetGroup = new THREE.Group();
    faucetGroup.position.set(0, cabY + cabH / 2 + topThick, -cabD * 0.28);

    // Base collar
    const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.03, 16), brassMat);
    baseCollar.position.set(0, 0.015, 0);
    faucetGroup.add(baseCollar);

    // Vertical riser stem
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.28, 16), brassMat);
    riser.position.set(0, 0.15, 0);
    faucetGroup.add(riser);

    // Arched forward spout
    const archGeo = new THREE.TorusGeometry(0.09, 0.015, 12, 24, Math.PI * 0.7);
    const archMesh = new THREE.Mesh(archGeo, brassMat);
    archMesh.position.set(0, 0.28, 0.06);
    archMesh.rotation.y = Math.PI / 2;
    archMesh.rotation.x = -Math.PI * 0.3;
    faucetGroup.add(archMesh);

    // Downward aerator tip
    const aerator = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 12), brassMat);
    aerator.position.set(0, 0.24, 0.15);
    faucetGroup.add(aerator);

    // Left & Right knurled hot/cold rotary valves
    [-0.14, 0.14].forEach((vx) => {
      const vCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.025, 16), brassMat);
      vCollar.position.set(vx, 0.012, 0);
      faucetGroup.add(vCollar);

      const vKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.045, 16), brassMat);
      vKnob.position.set(vx, 0.045, 0);
      faucetGroup.add(vKnob);
    });
    group.add(faucetGroup);

    // 7. Wall-Mounted Backlit LED Mirror
    const mirrorW = Math.min(w * 0.88, 0.75);
    const mirrorH = 0.95;
    const mirrorY = cabY + cabH / 2 + topThick + 0.3 + mirrorH / 2;
    const mirrorZ = -cabD / 2 - 0.015;

    // Soft warm LED halo glow backing plate
    const haloGeo = new THREE.BoxGeometry(mirrorW + 0.06, mirrorH + 0.06, 0.015);
    const haloMesh = new THREE.Mesh(haloGeo, lampWarmMat);
    haloMesh.position.set(0, mirrorY, mirrorZ - 0.008);
    group.add(haloMesh);

    // Brass perimeter frame bezel
    const bezelGeo = new THREE.BoxGeometry(mirrorW + 0.03, mirrorH + 0.03, 0.025);
    const bezelMesh = new THREE.Mesh(bezelGeo, brassMat);
    bezelMesh.position.set(0, mirrorY, mirrorZ);
    group.add(bezelMesh);

    // Highly reflective glass mirror surface
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      metalness: 0.98,
      roughness: 0.02,
    });
    const mFaceGeo = new THREE.BoxGeometry(mirrorW, mirrorH, 0.026);
    const mFaceMesh = new THREE.Mesh(mFaceGeo, mirrorMat);
    mFaceMesh.position.set(0, mirrorY, mirrorZ + 0.005);
    group.add(mFaceMesh);

    // 8. Luxury Powder Room Amenities on Countertop
    // Folded white waffle hand towels
    const towelGeo = new THREE.BoxGeometry(0.18, 0.06, 0.22);
    const towelMesh = new THREE.Mesh(towelGeo, linenMat);
    towelMesh.position.set(-topW / 2 + 0.14, cabY + cabH / 2 + topThick + 0.03, 0.02);
    towelMesh.rotation.y = 0.1;
    group.add(towelMesh);

    // Amber glass soap dispenser bottle
    const amberMat = new THREE.MeshStandardMaterial({
      color: '#b45309',
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const bottleGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.11, 16);
    const bottle = new THREE.Mesh(bottleGeo, amberMat);
    bottle.position.set(topW / 2 - 0.14, cabY + cabH / 2 + topThick + 0.055, -0.06);
    group.add(bottle);

    const pumpGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 12);
    const pump = new THREE.Mesh(pumpGeo, brassMat);
    pump.position.set(topW / 2 - 0.14, cabY + cabH / 2 + topThick + 0.13, -0.06);
    group.add(pump);

    // Mini succulent planter in white ceramic pot
    const potGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.06, 16);
    const pot = new THREE.Mesh(potGeo, porcelainMat);
    pot.position.set(topW / 2 - 0.14, cabY + cabH / 2 + topThick + 0.03, 0.1);
    group.add(pot);

    const plantMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.7 });
    const plantGeo = new THREE.DodecahedronGeometry(0.038, 1);
    const plant = new THREE.Mesh(plantGeo, plantMat);
    plant.position.set(topW / 2 - 0.14, cabY + cabH / 2 + topThick + 0.08, 0.1);
    group.add(plant);
  } else if (furn.catalogId === 'porch_car') {
    // Low ground paving slab for car parking
    const paveGeo = new THREE.BoxGeometry(w, 0.04, d);
    const paveMesh = new THREE.Mesh(paveGeo, pavingMat);
    paveMesh.position.set(0, 0.02, 0);
    paveMesh.receiveShadow = true;
    group.add(paveMesh);

    // White parking stall boundary lines (left & right)
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });
    const stripeGeo = new THREE.BoxGeometry(0.1, 0.045, d * 0.95);
    const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
    leftStripe.position.set(-w / 2 + 0.06, 0.025, 0);
    const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
    rightStripe.position.set(w / 2 - 0.06, 0.025, 0);
    group.add(leftStripe);
    group.add(rightStripe);

    // Concrete wheel bumper stop bar at the front
    const stopGeo = new THREE.BoxGeometry(w * 0.65, 0.12, 0.18);
    const stopMesh = new THREE.Mesh(stopGeo, pavingMat);
    stopMesh.position.set(0, 0.08, -d / 2 + 0.4);
    group.add(stopMesh);

    // Procedural parked vehicle model
    const carGroup = new THREE.Group();
    const carBodyMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.3, metalness: 0.6 });
    const carGlassMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
    const headlampMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.5 });
    const taillampMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.5 });

    const carW = w * 0.68;
    const carL = d * 0.72;

    // Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(carW, 0.42, carL);
    const chassisMesh = new THREE.Mesh(chassisGeo, carBodyMat);
    chassisMesh.position.set(0, 0.35, 0);
    chassisMesh.castShadow = true;
    carGroup.add(chassisMesh);

    // Cabin / Greenhouse
    const cabinGeo = new THREE.BoxGeometry(carW * 0.88, 0.38, carL * 0.46);
    const cabinMesh = new THREE.Mesh(cabinGeo, carGlassMat);
    cabinMesh.position.set(0, 0.72, 0.08);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    const wX = carW / 2;
    const wZFront = -carL * 0.28;
    const wZRear = carL * 0.28;
    const wheelOffsets: [number, number][] = [
      [-wX, wZFront],
      [wX, wZFront],
      [-wX, wZRear],
      [wX, wZRear],
    ];
    wheelOffsets.forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.18, wz);
      carGroup.add(wheel);
    });

    // Headlights (front of car)
    const hlGeo = new THREE.BoxGeometry(0.18, 0.08, 0.02);
    const hlL = new THREE.Mesh(hlGeo, headlampMat);
    hlL.position.set(-carW * 0.32, 0.38, -carL / 2 - 0.01);
    const hlR = new THREE.Mesh(hlGeo, headlampMat);
    hlR.position.set(carW * 0.32, 0.38, -carL / 2 - 0.01);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // Taillights (rear of car)
    const tlL = new THREE.Mesh(hlGeo, taillampMat);
    tlL.position.set(-carW * 0.32, 0.38, carL / 2 + 0.01);
    const tlR = new THREE.Mesh(hlGeo, taillampMat);
    tlR.position.set(carW * 0.32, 0.38, carL / 2 + 0.01);
    carGroup.add(tlL);
    carGroup.add(tlR);

    group.add(carGroup);
  } else if (furn.catalogId === 'entry_gate') {
    // Gate masonry pillars at left and right
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 });
    const pillarGeo = new THREE.BoxGeometry(0.35, h, 0.35);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-w / 2 + 0.18, h / 2, 0);
    leftPillar.castShadow = true;
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(w / 2 - 0.18, h / 2, 0);
    rightPillar.castShadow = true;
    group.add(leftPillar);
    group.add(rightPillar);

    // Ornamental steel gate frame
    const gateMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.8 });
    const spanW = w - 0.5;

    // Top and bottom horizontal rails
    const railGeo = new THREE.BoxGeometry(spanW, 0.06, 0.06);
    const topRail = new THREE.Mesh(railGeo, gateMat);
    topRail.position.set(0, h * 0.88, 0);
    const bottomRail = new THREE.Mesh(railGeo, gateMat);
    bottomRail.position.set(0, 0.15, 0);
    group.add(topRail);
    group.add(bottomRail);

    // Vertical pickets/grill bars
    const numBars = Math.max(6, Math.floor(spanW / 0.3));
    const barGeo = new THREE.CylinderGeometry(0.018, 0.018, h * 0.85, 8);
    for (let i = 0; i <= numBars; i++) {
      const bx = -spanW / 2 + (i * spanW) / numBars;
      const bar = new THREE.Mesh(barGeo, gateMat);
      bar.position.set(bx, h * 0.5, 0);
      bar.castShadow = true;
      group.add(bar);
    }
  } else {
    // Generic solid bounding box
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, oakMat);
    mesh.position.set(0, h / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

/**
 * Builds 3D sloped roof geometry for Gable, Hip, Flat, or Shed roofs.
 */
function build3DRoofMesh(
  roof: Roof,
  walls: Wall[],
  floorElevUnits: number,
  ceilingHeightUnits: number
): THREE.Group {
  const group = new THREE.Group();
  const bounds = computeRoofBounds(walls, roof.overhang);
  const eaveY = floorElevUnits + ceilingHeightUnits;
  const halfSpan = roof.ridgeAxis === 'x' ? bounds.depth / 2 : bounds.width / 2;
  const peakRiseSixteenths = Math.round(halfSpan * (roof.pitch / 12));
  const peakRiseUnits = sixteenthsToThreeUnits(peakRiseSixteenths);
  const ridgeY = eaveY + peakRiseUnits;

  const xMin = sixteenthsToThreeUnits(bounds.minX);
  const xMax = sixteenthsToThreeUnits(bounds.maxX);
  const zMin = -sixteenthsToThreeUnits(bounds.maxY);
  const zMax = -sixteenthsToThreeUnits(bounds.minY);
  const xCenter = (xMin + xMax) / 2;
  const zCenter = (zMin + zMax) / 2;

  const roofMat = new THREE.MeshStandardMaterial({
    color: '#334155', // architectural slate shingles
    roughness: 0.85,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const gableWallMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0', // matching exterior wall color
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  if (roof.type === 'gable') {
    if (roof.ridgeAxis === 'x') {
      // South slope
      const southGeo = new THREE.BufferGeometry();
      const southVerts = new Float32Array([
        xMin, eaveY, zMax,
        xMax, eaveY, zMax,
        xMax, ridgeY, zCenter,

        xMin, eaveY, zMax,
        xMax, ridgeY, zCenter,
        xMin, ridgeY, zCenter,
      ]);
      southGeo.setAttribute('position', new THREE.BufferAttribute(southVerts, 3));
      southGeo.computeVertexNormals();
      const southMesh = new THREE.Mesh(southGeo, roofMat);
      southMesh.castShadow = true;
      group.add(southMesh);

      // North slope
      const northGeo = new THREE.BufferGeometry();
      const northVerts = new Float32Array([
        xMin, ridgeY, zCenter,
        xMax, ridgeY, zCenter,
        xMax, eaveY, zMin,

        xMin, ridgeY, zCenter,
        xMax, eaveY, zMin,
        xMin, eaveY, zMin,
      ]);
      northGeo.setAttribute('position', new THREE.BufferAttribute(northVerts, 3));
      northGeo.computeVertexNormals();
      const northMesh = new THREE.Mesh(northGeo, roofMat);
      northMesh.castShadow = true;
      group.add(northMesh);

      // West gable end wall
      const westGeo = new THREE.BufferGeometry();
      const westVerts = new Float32Array([
        xMin, eaveY, zMax,
        xMin, ridgeY, zCenter,
        xMin, eaveY, zMin,
      ]);
      westGeo.setAttribute('position', new THREE.BufferAttribute(westVerts, 3));
      westGeo.computeVertexNormals();
      const westMesh = new THREE.Mesh(westGeo, gableWallMat);
      westMesh.castShadow = true;
      group.add(westMesh);

      // East gable end wall
      const eastGeo = new THREE.BufferGeometry();
      const eastVerts = new Float32Array([
        xMax, eaveY, zMin,
        xMax, ridgeY, zCenter,
        xMax, eaveY, zMax,
      ]);
      eastGeo.setAttribute('position', new THREE.BufferAttribute(eastVerts, 3));
      eastGeo.computeVertexNormals();
      const eastMesh = new THREE.Mesh(eastGeo, gableWallMat);
      eastMesh.castShadow = true;
      group.add(eastMesh);
    } else {
      // Ridge along Z
      const westGeo = new THREE.BufferGeometry();
      const westVerts = new Float32Array([
        xMin, eaveY, zMin,
        xMin, eaveY, zMax,
        xCenter, ridgeY, zMax,

        xMin, eaveY, zMin,
        xCenter, ridgeY, zMax,
        xCenter, ridgeY, zMin,
      ]);
      westGeo.setAttribute('position', new THREE.BufferAttribute(westVerts, 3));
      westGeo.computeVertexNormals();
      group.add(new THREE.Mesh(westGeo, roofMat));

      const eastGeo = new THREE.BufferGeometry();
      const eastVerts = new Float32Array([
        xCenter, ridgeY, zMin,
        xCenter, ridgeY, zMax,
        xMax, eaveY, zMax,

        xCenter, ridgeY, zMin,
        xMax, eaveY, zMax,
        xMax, eaveY, zMin,
      ]);
      eastGeo.setAttribute('position', new THREE.BufferAttribute(eastVerts, 3));
      eastGeo.computeVertexNormals();
      group.add(new THREE.Mesh(eastGeo, roofMat));

      // Gable ends North and South
      const northGeo = new THREE.BufferGeometry();
      const northVerts = new Float32Array([
        xMin, eaveY, zMin,
        xCenter, ridgeY, zMin,
        xMax, eaveY, zMin,
      ]);
      northGeo.setAttribute('position', new THREE.BufferAttribute(northVerts, 3));
      northGeo.computeVertexNormals();
      group.add(new THREE.Mesh(northGeo, gableWallMat));

      const southGeo = new THREE.BufferGeometry();
      const southVerts = new Float32Array([
        xMax, eaveY, zMax,
        xCenter, ridgeY, zMax,
        xMin, eaveY, zMax,
      ]);
      southGeo.setAttribute('position', new THREE.BufferAttribute(southVerts, 3));
      southGeo.computeVertexNormals();
      group.add(new THREE.Mesh(southGeo, gableWallMat));
    }
  } else if (roof.type === 'hip') {
    const inset = Math.min((xMax - xMin) / 4, (zMax - zMin) / 2);
    const rStart = { x: xMin + inset, z: zCenter };
    const rEnd = { x: xMax - inset, z: zCenter };

    // South trapezoid
    const sGeo = new THREE.BufferGeometry();
    const sVerts = new Float32Array([
      xMin, eaveY, zMax,
      xMax, eaveY, zMax,
      rEnd.x, ridgeY, rEnd.z,

      xMin, eaveY, zMax,
      rEnd.x, ridgeY, rEnd.z,
      rStart.x, ridgeY, rStart.z,
    ]);
    sGeo.setAttribute('position', new THREE.BufferAttribute(sVerts, 3));
    sGeo.computeVertexNormals();
    group.add(new THREE.Mesh(sGeo, roofMat));

    // North trapezoid
    const nGeo = new THREE.BufferGeometry();
    const nVerts = new Float32Array([
      xMin, eaveY, zMin,
      rStart.x, ridgeY, rStart.z,
      rEnd.x, ridgeY, rEnd.z,

      xMin, eaveY, zMin,
      rEnd.x, ridgeY, rEnd.z,
      xMax, eaveY, zMin,
    ]);
    nGeo.setAttribute('position', new THREE.BufferAttribute(nVerts, 3));
    nGeo.computeVertexNormals();
    group.add(new THREE.Mesh(nGeo, roofMat));

    // West hip triangle
    const wGeo = new THREE.BufferGeometry();
    const wVerts = new Float32Array([
      xMin, eaveY, zMax,
      rStart.x, ridgeY, rStart.z,
      xMin, eaveY, zMin,
    ]);
    wGeo.setAttribute('position', new THREE.BufferAttribute(wVerts, 3));
    wGeo.computeVertexNormals();
    group.add(new THREE.Mesh(wGeo, roofMat));

    // East hip triangle
    const eGeo = new THREE.BufferGeometry();
    const eVerts = new Float32Array([
      xMax, eaveY, zMin,
      rEnd.x, ridgeY, rEnd.z,
      xMax, eaveY, zMax,
    ]);
    eGeo.setAttribute('position', new THREE.BufferAttribute(eVerts, 3));
    eGeo.computeVertexNormals();
    group.add(new THREE.Mesh(eGeo, roofMat));
  } else if (roof.type === 'shed') {
    const shedGeo = new THREE.BufferGeometry();
    const sVerts = new Float32Array([
      xMin, eaveY, zMax,
      xMax, eaveY, zMax,
      xMax, ridgeY, zMin,

      xMin, eaveY, zMax,
      xMax, ridgeY, zMin,
      xMin, ridgeY, zMin,
    ]);
    shedGeo.setAttribute('position', new THREE.BufferAttribute(sVerts, 3));
    shedGeo.computeVertexNormals();
    group.add(new THREE.Mesh(shedGeo, roofMat));
  } else {
    // Flat roof
    const w = xMax - xMin;
    const d = zMax - zMin;
    const flatGeo = new THREE.BoxGeometry(w, 0.4, d);
    const flatMesh = new THREE.Mesh(flatGeo, roofMat);
    flatMesh.position.set(xCenter, eaveY + 0.2, zCenter);
    group.add(flatMesh);
  }

  return group;
}

/**
 * Builds 3D stepped solid staircase with treads, risers, and handrail geometry.
 */
function build3DStairMesh(stair: Staircase, floorElevUnits: number): THREE.Group {
  const stairGroup = new THREE.Group();
  const riserUnits = sixteenthsToThreeUnits(stair.riserHeight);
  const treadUnits = sixteenthsToThreeUnits(stair.treadDepth);
  const widthUnits = sixteenthsToThreeUnits(stair.width);
  const startX = sixteenthsToThreeUnits(stair.startPoint.x);
  const startZ = -sixteenthsToThreeUnits(stair.startPoint.y);

  stairGroup.position.set(startX, floorElevUnits, startZ);
  stairGroup.rotation.y = -stair.angle;

  const treadMat = new THREE.MeshStandardMaterial({
    color: '#b58852', // oak hardwood tread
    roughness: 0.45,
    metalness: 0.1,
  });

  const riserMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9', // white riser
    roughness: 0.7,
    metalness: 0.05,
  });

  const railMat = new THREE.MeshStandardMaterial({
    color: '#26292b', // black metal railing
    roughness: 0.3,
    metalness: 0.8,
  });

  const riserMats = [riserMat, riserMat, treadMat, riserMat, riserMat, riserMat];

  if (stair.type === 'straight') {
    const treadsCount = Math.max(2, stair.riserCount - 1);
    for (let i = 0; i < treadsCount; i++) {
      const stepH = (i + 1) * riserUnits;
      const stepGeo = new THREE.BoxGeometry(treadUnits, stepH, widthUnits);
      const stepMesh = new THREE.Mesh(stepGeo, riserMats);
      stepMesh.position.set(i * treadUnits + treadUnits / 2, stepH / 2, 0);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      stairGroup.add(stepMesh);
    }

    if (stair.hasHandrail) {
      const railH = 3.0; // 36"
      const totalRun = treadsCount * treadUnits;
      const totalRise = treadsCount * riserUnits;

      const addRailSide = (zOffset: number) => {
        for (let i = 0; i < treadsCount; i += 2) {
          const postGeo = new THREE.CylinderGeometry(0.04, 0.04, railH, 8);
          const postMesh = new THREE.Mesh(postGeo, railMat);
          const postY = (i + 1) * riserUnits + railH / 2;
          postMesh.position.set(i * treadUnits + treadUnits / 2, postY, zOffset);
          stairGroup.add(postMesh);
        }

        const slopeLen = Math.hypot(totalRun, totalRise);
        const railGeo = new THREE.BoxGeometry(slopeLen, 0.12, 0.06);
        const railMesh = new THREE.Mesh(railGeo, railMat);
        const slopeAngle = Math.atan2(totalRise, totalRun);
        railMesh.position.set(totalRun / 2, totalRise / 2 + railH, zOffset);
        railMesh.rotation.z = slopeAngle;
        stairGroup.add(railMesh);
      };

      if (stair.handrailSide === 'both' || stair.handrailSide === 'left') {
        addRailSide(widthUnits / 2 - 0.1);
      }
      if (stair.handrailSide === 'both' || stair.handrailSide === 'right') {
        addRailSide(-widthUnits / 2 + 0.1);
      }
    }
  } else if (stair.type === 'l-shaped') {
    const flight1Treads = Math.floor((stair.riserCount - 1) / 2);
    const flight2Treads = (stair.riserCount - 1) - flight1Treads;
    const landingDepthUnits = sixteenthsToThreeUnits(stair.landingDepth);

    for (let i = 0; i < flight1Treads; i++) {
      const stepH = (i + 1) * riserUnits;
      const stepGeo = new THREE.BoxGeometry(treadUnits, stepH, widthUnits);
      const stepMesh = new THREE.Mesh(stepGeo, riserMats);
      stepMesh.position.set(i * treadUnits + treadUnits / 2, stepH / 2, 0);
      stairGroup.add(stepMesh);
    }

    const landingH = flight1Treads * riserUnits;
    const landingGeo = new THREE.BoxGeometry(landingDepthUnits, landingH, widthUnits);
    const landingMesh = new THREE.Mesh(landingGeo, riserMats);
    landingMesh.position.set(flight1Treads * treadUnits + landingDepthUnits / 2, landingH / 2, 0);
    stairGroup.add(landingMesh);

    for (let j = 0; j < flight2Treads; j++) {
      const stepH = (flight1Treads + j + 1) * riserUnits;
      const stepGeo = new THREE.BoxGeometry(widthUnits, stepH, treadUnits);
      const stepMesh = new THREE.Mesh(stepGeo, riserMats);
      stepMesh.position.set(
        flight1Treads * treadUnits + landingDepthUnits / 2,
        stepH / 2,
        -(widthUnits / 2 + j * treadUnits + treadUnits / 2)
      );
      stairGroup.add(stepMesh);
    }
  } else {
    // U-shaped
    const flight1Treads = Math.floor((stair.riserCount - 1) / 2);
    const flight2Treads = (stair.riserCount - 1) - flight1Treads;
    const landingDepthUnits = sixteenthsToThreeUnits(stair.landingDepth);
    const totalW = widthUnits * 2 + 0.1;

    for (let i = 0; i < flight1Treads; i++) {
      const stepH = (i + 1) * riserUnits;
      const stepGeo = new THREE.BoxGeometry(treadUnits, stepH, widthUnits);
      const stepMesh = new THREE.Mesh(stepGeo, riserMats);
      stepMesh.position.set(i * treadUnits + treadUnits / 2, stepH / 2, widthUnits / 2 + 0.05);
      stairGroup.add(stepMesh);
    }

    const landingH = flight1Treads * riserUnits;
    const landingGeo = new THREE.BoxGeometry(landingDepthUnits, landingH, totalW);
    const landingMesh = new THREE.Mesh(landingGeo, riserMats);
    landingMesh.position.set(flight1Treads * treadUnits + landingDepthUnits / 2, landingH / 2, 0);
    stairGroup.add(landingMesh);

    for (let j = 0; j < flight2Treads; j++) {
      const stepH = (flight1Treads + j + 1) * riserUnits;
      const stepGeo = new THREE.BoxGeometry(treadUnits, stepH, widthUnits);
      const stepMesh = new THREE.Mesh(stepGeo, riserMats);
      stepMesh.position.set(
        flight1Treads * treadUnits - (j * treadUnits + treadUnits / 2),
        stepH / 2,
        -(widthUnits / 2 + 0.05)
      );
      stairGroup.add(stepMesh);
    }
  }

  return stairGroup;
}

/**
 * Computes the 3D bounding center and framing radius enclosing all building walls, columns, and furniture.
 */
function getProjectCenter(project: Project): { center: THREE.Vector3; radius: number } {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let count = 0;

  for (const floor of project.floors) {
    for (const wall of floor.walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
      count++;
    }
    for (const col of floor.columns || []) {
      const hw = col.width / 2;
      const hd = col.depth / 2;
      minX = Math.min(minX, col.position.x - hw);
      maxX = Math.max(maxX, col.position.x + hw);
      minY = Math.min(minY, col.position.y - hd);
      maxY = Math.max(maxY, col.position.y + hd);
      count++;
    }
    for (const furn of floor.furniture || []) {
      const hw = furn.dimensions.width / 2;
      const hd = furn.dimensions.depth / 2;
      minX = Math.min(minX, furn.position.x - hw);
      maxX = Math.max(maxX, furn.position.x + hw);
      minY = Math.min(minY, furn.position.y - hd);
      maxY = Math.max(maxY, furn.position.y + hd);
      count++;
    }
  }

  if (count === 0 || !isFinite(minX)) {
    return { center: new THREE.Vector3(0, 4, 0), radius: 35 };
  }

  // Convert CAD sixteenths to Three.js units (CAD X -> Three.js X, CAD Y -> Three.js -Z)
  const cX = sixteenthsToThreeUnits((minX + maxX) / 2);
  const cZ = -sixteenthsToThreeUnits((minY + maxY) / 2);
  const spanX = sixteenthsToThreeUnits(maxX - minX);
  const spanZ = sixteenthsToThreeUnits(maxY - minY);
  const diag = Math.sqrt(spanX * spanX + spanZ * spanZ);

  return {
    center: new THREE.Vector3(cX, 4, cZ),
    radius: Math.max(25, diag * 1.3),
  };
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  project,
  selectedWallId,
  onSelectWall,
  showRoof: propShowRoof,
  onToggleShowRoof,
  viewMode: propViewMode,
  onToggleViewMode,
  onWalkCameraMove,
  onToggleDoorOpen,
  onUpdate3D,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const slabsGroupRef = useRef<THREE.Group | null>(null);
  const columnsGroupRef = useRef<THREE.Group | null>(null);
  const stairsGroupRef = useRef<THREE.Group | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const siteGroupRef = useRef<THREE.Group | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const [localShowRoof, setLocalShowRoof] = useState(
    propShowRoof ?? (project.settings.showRoof3D !== false)
  );
  const [localViewMode, setLocalViewMode] = useState<'orbit' | 'walk'>(propViewMode || 'orbit');

  const viewModeRef = useRef<'orbit' | 'walk'>(propViewMode || 'orbit');
  viewModeRef.current = localViewMode;

  // Active 3D navigation tool: Orbit (Rotate) vs Pan (Drag)
  const [navTool, setNavTool] = useState<'orbit' | 'pan'>('orbit');
  const navToolRef = useRef<'orbit' | 'pan'>('orbit');
  navToolRef.current = navTool;

  // Ultra-Realistic Architectural Lighting & Flooring Atmosphere
  const [lightingMode, setLightingMode] = useState<'daylight' | 'golden' | 'night'>('daylight');
  const [sunTime, setSunTime] = useState<number>(project.settings.sunTimeHours ?? 14.5);
  const [floorStyle, setFloorStyle] = useState<FloorStyle>('oak');
  const [isRenderStudioOpen, setIsRenderStudioOpen] = useState(false);

  // Dollhouse horizontal cutting plane state
  const [dollhouseCut, setDollhouseCut] = useState<number>(
    project.settings.dollhouseCutHeightPercent ?? 100
  );
  const dollhouseCutRef = useRef<number>(dollhouseCut);
  dollhouseCutRef.current = dollhouseCut;
  const miniMapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const skyDomeRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientBounceRef = useRef<THREE.DirectionalLight | null>(null);
  const interiorLightsGroupRef = useRef<THREE.Group | null>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    if (propShowRoof !== undefined) {
      setLocalShowRoof(propShowRoof);
    }
  }, [propShowRoof]);

  useEffect(() => {
    if (propViewMode !== undefined) {
      setLocalViewMode(propViewMode);
    }
  }, [propViewMode]);

  // Camera Orbit & Pan State
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const orbitStateRef = useRef({
    spherical: new THREE.Spherical(35, Math.PI / 3, Math.PI / 4),
    target: new THREE.Vector3(0, 4, 0),
  });

  // Mathematically precise camera-plane pan
  const panCamera = useCallback((deltaX: number, deltaY: number) => {
    const camera = cameraRef.current;
    const mount = mountRef.current;
    if (!camera || !mount) return;

    const { target, spherical } = orbitStateRef.current;
    const distance = spherical.radius;
    const fovRad = (camera.fov * Math.PI) / 360;
    const targetHeight = 2 * distance * Math.tan(fovRad);
    const factor = targetHeight / Math.max(100, mount.clientHeight);

    // Camera view-plane axes in world coordinates
    const right = new THREE.Vector3(
      camera.matrix.elements[0],
      camera.matrix.elements[1],
      camera.matrix.elements[2]
    );
    const up = new THREE.Vector3(
      camera.matrix.elements[4],
      camera.matrix.elements[5],
      camera.matrix.elements[6]
    );

    target.addScaledVector(right, -deltaX * factor);
    target.addScaledVector(up, deltaY * factor);
  }, []);

  // Smooth zoom function
  const zoomCamera = useCallback((factor: number) => {
    orbitStateRef.current.spherical.radius = Math.max(
      3,
      Math.min(250, orbitStateRef.current.spherical.radius * factor)
    );
  }, []);

  // Center view on house bounding center
  const fitToHouse = useCallback(() => {
    const { center, radius } = getProjectCenter(project);
    orbitStateRef.current.target.copy(center);
    orbitStateRef.current.spherical.radius = radius;
    orbitStateRef.current.spherical.theta = Math.PI / 4;
    orbitStateRef.current.spherical.phi = Math.PI / 3;
  }, [project]);

  // Auto-frame house on initial model load
  const initialFramedRef = useRef(false);
  useEffect(() => {
    if (!initialFramedRef.current && project.floors.some((f) => f.walls.length > 0)) {
      fitToHouse();
      initialFramedRef.current = true;
    }
  }, [project, fitToHouse]);

  // First-Person Walkthrough State
  const walkStateRef = useRef<{
    position: THREE.Vector3;
    yaw: number;
    pitch: number;
    keys: { [k: string]: boolean };
  }>({
    position: new THREE.Vector3(0, 5.5, 0),
    yaw: 0,
    pitch: 0,
    keys: {},
  });

  const furnitureGroupRef = useRef<THREE.Group | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38bdf8');
    scene.fog = new THREE.FogExp2('#e0f2fe', 0.0015);
    sceneRef.current = scene;

    // Camera: Y is up in Three.js standard
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 600);
    cameraRef.current = camera;

    // Renderer with high-end physical tone mapping & soft shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Architectural soft contact shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Groups
    const wallsGroup = new THREE.Group();
    const slabsGroup = new THREE.Group();
    const columnsGroup = new THREE.Group();
    const stairsGroup = new THREE.Group();
    const roofGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    const interiorLightsGroup = new THREE.Group();
    const siteGroup = new THREE.Group();

    scene.add(wallsGroup);
    scene.add(slabsGroup);
    scene.add(columnsGroup);
    scene.add(stairsGroup);
    scene.add(roofGroup);
    scene.add(furnitureGroup);
    scene.add(interiorLightsGroup);
    scene.add(siteGroup);

    wallsGroupRef.current = wallsGroup;
    slabsGroupRef.current = slabsGroup;
    columnsGroupRef.current = columnsGroup;
    stairsGroupRef.current = stairsGroup;
    roofGroupRef.current = roofGroup;
    furnitureGroupRef.current = furnitureGroup;
    interiorLightsGroupRef.current = interiorLightsGroup;
    siteGroupRef.current = siteGroup;

    // Atmospheric Sky Dome
    const skyGeo = new THREE.SphereGeometry(240, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createSkyDomeTexture('daylight'),
      side: THREE.BackSide,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);
    skyDomeRef.current = skyDome;

    // Lighting Setup
    const hemiLight = new THREE.HemisphereLight('#f0f9ff', '#64748b', 0.85);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight('#fffaf0', 1.8);
    sunLight.position.set(35, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.radius = 3.5;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Warm interior ambient bounce light
    const bounceLight = new THREE.DirectionalLight('#fef3c7', 0.5);
    bounceLight.position.set(-25, -15, -25);
    scene.add(bounceLight);
    ambientBounceRef.current = bounceLight;

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(250, 250);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#334155', // Slate terrace & lawn tone
      roughness: 0.9,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Architectural Ground Grid (10' major, 1' minor)
    const gridHelper = new THREE.GridHelper(100, 100, '#94a3b8', '#cbd5e1');
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Keyboard listener for first-person walk and orbit/pan navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (viewModeRef.current === 'walk') {
        walkStateRef.current.keys[e.code] = true;
      } else {
        if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
          panCamera(15, 0);
        } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
          panCamera(-15, 0);
        } else if (e.key === 'ArrowUp' || e.code === 'KeyW') {
          panCamera(0, 15);
        } else if (e.key === 'ArrowDown' || e.code === 'KeyS') {
          panCamera(0, -15);
        } else if (e.key === '+' || e.key === '=') {
          zoomCamera(0.88);
        } else if (e.key === '-' || e.key === '_') {
          zoomCamera(1.12);
        } else if (e.code === 'KeyF' && !e.metaKey && !e.ctrlKey) {
          fitToHouse();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (viewModeRef.current === 'walk') {
        walkStateRef.current.keys[e.code] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (viewModeRef.current === 'walk') {
        const walk = walkStateRef.current;
        const moveSpeed = 0.2; // approx 3-4 mph walking pace
        const forward = new THREE.Vector3(Math.sin(walk.yaw), 0, -Math.cos(walk.yaw));
        const right = new THREE.Vector3(Math.cos(walk.yaw), 0, Math.sin(walk.yaw));

        const moveDelta = new THREE.Vector3();
        if (walk.keys['KeyW'] || walk.keys['ArrowUp']) moveDelta.add(forward);
        if (walk.keys['KeyS'] || walk.keys['ArrowDown']) moveDelta.sub(forward);
        if (walk.keys['KeyD'] || walk.keys['ArrowRight']) moveDelta.add(right);
        if (walk.keys['KeyA'] || walk.keys['ArrowLeft']) moveDelta.sub(right);

        if (moveDelta.lengthSq() > 0) {
          moveDelta.normalize().multiplyScalar(moveSpeed);
          const proposedX = walk.position.x + moveDelta.x;
          const proposedZ = walk.position.z + moveDelta.z;

          // Check wall collisions against active floor
          const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
          let collides = false;
          if (activeFloor) {
            for (const w of activeFloor.walls) {
              const x1 = sixteenthsToThreeUnits(w.start.x);
              const z1 = -sixteenthsToThreeUnits(w.start.y);
              const x2 = sixteenthsToThreeUnits(w.end.x);
              const z2 = -sixteenthsToThreeUnits(w.end.y);

              const dx = x2 - x1;
              const dz = z2 - z1;
              const lenSq = dx * dx + dz * dz;
              let t = lenSq > 0 ? ((proposedX - x1) * dx + (proposedZ - z1) * dz) / lenSq : 0;
              t = Math.max(0, Math.min(1, t));
              const projX = x1 + t * dx;
              const projZ = z1 + t * dz;
              const dist = Math.hypot(proposedX - projX, proposedZ - projZ);
              if (dist < 0.6) {
                // Check if stepping through an open door
                let isDoorway = false;
                const wallLenSixteenths = wallLength(w);
                const posAlongWallSixteenths = t * wallLenSixteenths;
                for (const op of w.openings) {
                  const opStart = op.offsetAlongWall - op.width / 2;
                  const opEnd = op.offsetAlongWall + op.width / 2;
                  if (posAlongWallSixteenths >= opStart && posAlongWallSixteenths <= opEnd) {
                    if (op.type === 'door' && op.isOpen) {
                      isDoorway = true;
                      break;
                    }
                  }
                }
                if (!isDoorway) {
                  collides = true;
                  break;
                }
              }
            }
          }

          if (!collides) {
            walk.position.x = proposedX;
            walk.position.z = proposedZ;
          }

          if (onWalkCameraMove) {
            onWalkCameraMove({
              x: threeUnitsToSixteenths(walk.position.x),
              y: -threeUnitsToSixteenths(walk.position.z),
              yaw: walk.yaw,
            });
          }
        }

        const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
        const floorElev = activeFloor ? sixteenthsToThreeUnits(activeFloor.elevation) : 0;
        walk.position.y = floorElev + 5.5; // 5' 6" eye height

        camera.position.copy(walk.position);
        const lookDir = new THREE.Vector3(
          Math.sin(walk.yaw) * Math.cos(walk.pitch),
          Math.sin(walk.pitch),
          -Math.cos(walk.yaw) * Math.cos(walk.pitch)
        );
        camera.lookAt(walk.position.clone().add(lookDir));
      } else {
        const { spherical, target } = orbitStateRef.current;
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
      }

      // Real-time Dollhouse horizontal section cutting plane
      if (renderer) {
        if (dollhouseCutRef.current < 100) {
          const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
          const totalHeightSixteenths =
            (activeFloor?.ceilingHeight || 1920) * Math.max(1, project.floors.length) + (activeFloor?.elevation || 0);
          const totalThreeUnits = sixteenthsToThreeUnits(totalHeightSixteenths);
          const cutY = Math.max(1.0, totalThreeUnits * (dollhouseCutRef.current / 100));
          renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), cutY)];
        } else {
          renderer.clippingPlanes = [];
        }
      }

      // Live First-Person Walk Mini-Map Radar
      if (viewModeRef.current === 'walk' && miniMapCanvasRef.current) {
        const mmCanvas = miniMapCanvasRef.current;
        const mmCtx = mmCanvas.getContext('2d');
        if (mmCtx) {
          const W = mmCanvas.width;
          const H = mmCanvas.height;
          const cX = W / 2;
          const cY = H / 2;
          mmCtx.clearRect(0, 0, W, H);

          // Radar Background & Grid
          mmCtx.fillStyle = '#090d16';
          mmCtx.fillRect(0, 0, W, H);

          mmCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
          mmCtx.lineWidth = 1;
          [28, 55, 82].forEach((r) => {
            mmCtx.beginPath();
            mmCtx.arc(cX, cY, r, 0, Math.PI * 2);
            mmCtx.stroke();
          });

          // Draw walls centered on player
          const walk = walkStateRef.current;
          const radarScale = 4.0;
          const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];

          if (activeFloor) {
            mmCtx.strokeStyle = '#38bdf8';
            mmCtx.lineWidth = 2.5;
            mmCtx.lineCap = 'round';
            for (const w of activeFloor.walls) {
              const x1 = sixteenthsToThreeUnits(w.start.x);
              const z1 = -sixteenthsToThreeUnits(w.start.y);
              const x2 = sixteenthsToThreeUnits(w.end.x);
              const z2 = -sixteenthsToThreeUnits(w.end.y);

              const sx1 = cX + (x1 - walk.position.x) * radarScale;
              const sy1 = cY + (z1 - walk.position.z) * radarScale;
              const sx2 = cX + (x2 - walk.position.x) * radarScale;
              const sy2 = cY + (z2 - walk.position.z) * radarScale;

              mmCtx.beginPath();
              mmCtx.moveTo(sx1, sy1);
              mmCtx.lineTo(sx2, sy2);
              mmCtx.stroke();

              // Open doors indicator
              for (const op of w.openings) {
                if (op.type === 'door' && op.isOpen) {
                  const angle = wallAngle(w);
                  const opCenterWorldX = w.start.x + Math.cos(angle) * op.offsetAlongWall;
                  const opCenterWorldY = w.start.y + Math.sin(angle) * op.offsetAlongWall;
                  const opX = sixteenthsToThreeUnits(opCenterWorldX);
                  const opZ = -sixteenthsToThreeUnits(opCenterWorldY);
                  const opSx = cX + (opX - walk.position.x) * radarScale;
                  const opSy = cY + (opZ - walk.position.z) * radarScale;
                  mmCtx.fillStyle = '#10b981';
                  mmCtx.beginPath();
                  mmCtx.arc(opSx, opSy, 3.5, 0, Math.PI * 2);
                  mmCtx.fill();
                }
              }
            }
          }

          // Player Field of View Cone (60 degrees)
          const fovRad = Math.PI / 3;
          const coneRadius = 45;
          mmCtx.save();
          mmCtx.translate(cX, cY);
          mmCtx.beginPath();
          mmCtx.moveTo(0, 0);
          mmCtx.arc(0, 0, coneRadius, -walk.yaw - fovRad / 2, -walk.yaw + fovRad / 2);
          mmCtx.closePath();
          mmCtx.fillStyle = 'rgba(234, 179, 8, 0.35)';
          mmCtx.fill();
          mmCtx.strokeStyle = '#eab308';
          mmCtx.lineWidth = 1.5;
          mmCtx.stroke();

          // Player Beacon Dot
          mmCtx.fillStyle = '#38bdf8';
          mmCtx.beginPath();
          mmCtx.arc(0, 0, 4.5, 0, Math.PI * 2);
          mmCtx.fill();
          mmCtx.strokeStyle = '#ffffff';
          mmCtx.lineWidth = 1.8;
          mmCtx.stroke();
          mmCtx.restore();

          // Heading & Title
          mmCtx.font = 'bold 9px monospace';
          mmCtx.fillStyle = '#38bdf8';
          mmCtx.fillText('WALK RADAR', 8, 14);
          mmCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          mmCtx.fillText('N ▲', W - 24, 14);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount || !cameraRef.current || !rendererRef.current) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [project, onWalkCameraMove]);

  // Dynamically update sky, sun, and ambient lighting when lightingMode changes
  useEffect(() => {
    const scene = sceneRef.current;
    const skyDome = skyDomeRef.current;
    const sunLight = sunLightRef.current;
    const hemiLight = hemiLightRef.current;
    const bounceLight = ambientBounceRef.current;
    const renderer = rendererRef.current;
    if (!scene || !skyDome || !sunLight || !hemiLight || !bounceLight || !renderer) return;

    const newSkyTex = createSkyDomeTexture(lightingMode);
    (skyDome.material as THREE.MeshBasicMaterial).map = newSkyTex;
    (skyDome.material as THREE.MeshBasicMaterial).needsUpdate = true;

    // Solar Elevation & Azimuth based on sunTime (6:00 AM to 7:00 PM)
    const solarProgress = (sunTime - 6) / 13;
    const solarAngle = Math.max(0.08, Math.min(Math.PI - 0.08, solarProgress * Math.PI));
    const sunElev = Math.sin(solarAngle);
    const sunAzim = -Math.cos(solarAngle);
    const sunDist = 72;
    const calcSunX = sunAzim * sunDist;
    const calcSunY = Math.max(4, sunElev * 58);
    const calcSunZ = Math.cos(solarAngle) * 32;

    if (lightingMode === 'daylight') {
      const isWarmHour = sunTime <= 7.5 || sunTime >= 17.0;
      scene.background = new THREE.Color(isWarmHour ? '#0284c7' : '#38bdf8');
      scene.fog = new THREE.FogExp2(isWarmHour ? '#fed7aa' : '#e0f2fe', 0.0015);
      sunLight.color.set(isWarmHour ? '#ff9838' : '#fffaf0');
      sunLight.intensity = isWarmHour ? 2.2 : 1.85;
      sunLight.position.set(calcSunX, calcSunY, calcSunZ);
      sunLight.shadow.radius = isWarmHour ? 4.5 : 3.5;
      hemiLight.color.set('#f0f9ff');
      hemiLight.groundColor.set('#64748b');
      hemiLight.intensity = 0.85;
      bounceLight.color.set(isWarmHour ? '#f97316' : '#fef3c7');
      bounceLight.intensity = 0.5;
      renderer.toneMappingExposure = 1.15;
    } else if (lightingMode === 'golden') {
      scene.background = new THREE.Color('#c2410c');
      scene.fog = new THREE.FogExp2('#ffedd5', 0.0025);
      sunLight.color.set('#ff8c28');
      sunLight.intensity = 2.4;
      sunLight.position.set(calcSunX, Math.min(22, calcSunY), calcSunZ);
      sunLight.shadow.radius = 4.8;
      hemiLight.color.set('#fed7aa');
      hemiLight.groundColor.set('#431407');
      hemiLight.intensity = 0.95;
      bounceLight.color.set('#f97316');
      bounceLight.intensity = 0.7;
      renderer.toneMappingExposure = 1.25;
    } else {
      // Luxury Night
      scene.background = new THREE.Color('#020617');
      scene.fog = new THREE.FogExp2('#020617', 0.0035);
      sunLight.color.set('#94a3b8');
      sunLight.intensity = 0.35;
      sunLight.position.set(20, 50, 20);
      sunLight.shadow.radius = 2.5;
      hemiLight.color.set('#1e293b');
      hemiLight.groundColor.set('#020617');
      hemiLight.intensity = 0.3;
      bounceLight.color.set('#0f172a');
      bounceLight.intensity = 0.15;
      renderer.toneMappingExposure = 1.4;
    }
  }, [lightingMode, sunTime]);

  // Synchronize 3D Meshes from Central Building Model
  useEffect(() => {
    const wallsGroup = wallsGroupRef.current;
    const slabsGroup = slabsGroupRef.current;
    const columnsGroup = columnsGroupRef.current;
    const stairsGroup = stairsGroupRef.current;
    const roofGroup = roofGroupRef.current;
    const interiorLightsGroup = interiorLightsGroupRef.current;
    if (!wallsGroup || !slabsGroup || !columnsGroup || !stairsGroup || !roofGroup) return;

    const clearGroup = (grp: THREE.Group) => {
      while (grp.children.length > 0) {
        const obj = grp.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        grp.remove(obj);
      }
    };

    clearGroup(wallsGroup);
    clearGroup(slabsGroup);
    clearGroup(columnsGroup);
    clearGroup(stairsGroup);
    clearGroup(roofGroup);
    if (interiorLightsGroup) clearGroup(interiorLightsGroup);

    // Luxury Architectural Materials
    const wallDefaultMat = new THREE.MeshStandardMaterial({
      color: '#faf8f5', // Chantilly Lace luxury warm off-white matte paint
      roughness: 0.88,
      metalness: 0.02,
    });

    const wallSelectedMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.45,
      metalness: 0.1,
      emissive: '#0284c7',
      emissiveIntensity: 0.25,
    });

    const baseboardMat = new THREE.MeshStandardMaterial({
      color: '#ffffff', // Crisp architectural semi-gloss baseboard molding
      roughness: 0.3,
      metalness: 0.05,
    });

    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: '#1e293b', // Sleek black anodized aluminum casing
      roughness: 0.35,
      metalness: 0.85,
    });

    const windowSillMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.35,
    });

    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      opacity: 0.22,
      transparent: true,
      roughness: 0.05,
      metalness: 0.95,
      depthWrite: false,
    });

    const doorJambMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.45,
    });

    const doorPanelMat = new THREE.MeshStandardMaterial({
      color: '#a67c52',
      roughness: 0.55,
    });

    const brassHardwareMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.85,
      roughness: 0.25,
    });

    // Dynamic Procedural Floor Material
    let floorTex = getOakFloorTexture();
    let floorRoughness = 0.38;
    let floorMetalness = 0.05;
    if (floorStyle === 'marble') {
      floorTex = getMarbleFloorTexture();
      floorRoughness = 0.12;
      floorMetalness = 0.08;
    } else if (floorStyle === 'walnut') {
      floorTex = getWalnutFloorTexture();
      floorRoughness = 0.42;
      floorMetalness = 0.05;
    } else if (floorStyle === 'tile') {
      floorTex = getTileFloorTexture();
      floorRoughness = 0.18;
      floorMetalness = 0.08;
    } else if (floorStyle === 'pvc') {
      floorTex = getPvcVinylTexture();
      floorRoughness = 0.6;
      floorMetalness = 0.02;
    } else if (floorStyle === 'matte') {
      floorTex = getMatteConcreteTexture();
      floorRoughness = 0.9;
      floorMetalness = 0.02;
    }

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: floorRoughness,
      metalness: floorMetalness,
    });

    const floorOakMat = new THREE.MeshStandardMaterial({
      map: getOakFloorTexture(),
      roughness: 0.45,
      metalness: 0.05,
    });

    const floorWalnutMat = new THREE.MeshStandardMaterial({
      map: getWalnutFloorTexture(),
      roughness: 0.42,
      metalness: 0.05,
    });

    const floorMarbleMat = new THREE.MeshStandardMaterial({
      map: getMarbleFloorTexture(),
      roughness: 0.2,
      metalness: 0.1,
    });

    const columnMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.6,
      metalness: 0.05,
    });

    // Build 3D Multi-Floor Stacking
    for (const floor of project.floors) {
      const floorElevUnits = sixteenthsToThreeUnits(floor.elevation);

      // 1. Build Slabs with upper floor stairwell openings
      let roomsToRender = (floor.rooms || []).filter((r) => r.polygon && r.polygon.length >= 3);
      if (roomsToRender.length === 0 && floor.walls && floor.walls.length >= 3) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const w of floor.walls) {
          minX = Math.min(minX, w.start.x, w.end.x);
          maxX = Math.max(maxX, w.start.x, w.end.x);
          minY = Math.min(minY, w.start.y, w.end.y);
          maxY = Math.max(maxY, w.start.y, w.end.y);
        }
        if (maxX > minX && maxY > minY) {
          roomsToRender = [
            {
              id: `slab_fallback_${floor.id}`,
              floorId: floor.id,
              name: floor.name || 'Floor Slab',
              wallIds: floor.walls.map((w) => w.id),
              polygon: [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY },
              ],
              floorMaterialId: floor.floorMaterialId || 'mat_oak_hardwood',
              flooringConfig: floor.flooringConfig,
              computedAreaSqFt: Math.round(((maxX - minX) * (maxY - minY)) / (192 * 192)),
            },
          ];
        }
      }

      for (const room of roomsToRender) {
        if (room.polygon.length < 3) continue;

        const shape = new THREE.Shape();
        const p0 = room.polygon[0];
        shape.moveTo(sixteenthsToThreeUnits(p0.x), -sixteenthsToThreeUnits(p0.y));
        for (let i = 1; i < room.polygon.length; i++) {
          const pt = room.polygon[i];
          shape.lineTo(sixteenthsToThreeUnits(pt.x), -sixteenthsToThreeUnits(pt.y));
        }
        shape.closePath();

        // Check if floor below has stairs and cut opening into this upper floor slab!
        const lowerFloor = project.floors.find((f) => f.levelIndex === floor.levelIndex - 1);
        if (lowerFloor && lowerFloor.stairs && lowerFloor.stairs.length > 0) {
          for (const stair of lowerFloor.stairs) {
            const cutout = getStairUpperCutout(stair);
            if (cutout.length >= 3) {
              const holePath = new THREE.Path();
              holePath.moveTo(sixteenthsToThreeUnits(cutout[0].x), -sixteenthsToThreeUnits(cutout[0].y));
              for (let k = 1; k < cutout.length; k++) {
                holePath.lineTo(sixteenthsToThreeUnits(cutout[k].x), -sixteenthsToThreeUnits(cutout[k].y));
              }
              holePath.closePath();
              shape.holes.push(holePath);
            }
          }
        }

        // Resolve per-room or floor custom flooring finish
        const targetMatId = room.floorMaterialId || floor.floorMaterialId;
        const targetConfig = room.flooringConfig || floor.flooringConfig;
        const roomMatDef = (project.materials || DEFAULT_MATERIALS).find(
          (m) => m.id === targetMatId
        );
        let roomFloorMat = floorMat;
        if (roomMatDef) {
          if (roomMatDef.category === 'wood') {
            roomFloorMat = roomMatDef.id === 'mat_walnut_wood' ? floorWalnutMat : floorOakMat;
          } else if (roomMatDef.category === 'marble') {
            roomFloorMat = new THREE.MeshStandardMaterial({
              map: getMarbleFloorTexture(),
              roughness: roomMatDef.roughness,
              metalness: roomMatDef.metalness,
            });
          } else if (roomMatDef.category === 'tile') {
            roomFloorMat = new THREE.MeshStandardMaterial({
              map: getTileFloorTexture(roomMatDef.id, targetConfig),
              roughness: roomMatDef.roughness,
              metalness: roomMatDef.metalness,
            });
          } else if (roomMatDef.category === 'pvc') {
            roomFloorMat = new THREE.MeshStandardMaterial({
              map: getPvcVinylTexture(roomMatDef.id),
              roughness: roomMatDef.roughness,
              metalness: roomMatDef.metalness,
            });
          } else if (roomMatDef.category === 'concrete') {
            roomFloorMat = new THREE.MeshStandardMaterial({
              map: getMatteConcreteTexture(roomMatDef.id),
              roughness: roomMatDef.roughness,
              metalness: roomMatDef.metalness,
            });
          } else {
            roomFloorMat = new THREE.MeshStandardMaterial({
              color: roomMatDef.color,
              roughness: roomMatDef.roughness,
              metalness: roomMatDef.metalness,
            });
          }
        }

        const slabThickness = 0.25; // ~3 inches
        const slabGeo = new THREE.ExtrudeGeometry(shape, {
          depth: slabThickness,
          bevelEnabled: false,
        });

        const slabMesh = new THREE.Mesh(slabGeo, roomFloorMat);
        slabMesh.rotation.x = Math.PI / 2;
        slabMesh.position.y = floorElevUnits;
        slabMesh.receiveShadow = true;
        slabsGroup.add(slabMesh);
      }

      // 2. Build Structural Columns
      for (const col of floor.columns || []) {
        const cw = sixteenthsToThreeUnits(col.width);
        const cd = sixteenthsToThreeUnits(col.depth);
        const ch = sixteenthsToThreeUnits(col.height);
        const cx = sixteenthsToThreeUnits(col.position.x);
        const cz = -sixteenthsToThreeUnits(col.position.y);
        const cy = floorElevUnits + ch / 2;

        const colGroup = new THREE.Group();
        colGroup.position.set(cx, 0, cz);
        colGroup.rotation.y = -(col.rotation || 0);

        if (col.shape === 'rectangular') {
          const shaftGeo = new THREE.BoxGeometry(cw, ch, cd);
          const shaftMesh = new THREE.Mesh(shaftGeo, columnMat);
          shaftMesh.position.set(0, cy, 0);
          shaftMesh.castShadow = true;
          shaftMesh.receiveShadow = true;
          colGroup.add(shaftMesh);

          // Base trim & capital trim
          const trimH = ch * 0.04;
          const trimGeo = new THREE.BoxGeometry(cw * 1.15, trimH, cd * 1.15);
          const baseMesh = new THREE.Mesh(trimGeo, columnMat);
          baseMesh.position.set(0, floorElevUnits + trimH / 2, 0);
          colGroup.add(baseMesh);

          const capMesh = new THREE.Mesh(trimGeo, columnMat);
          capMesh.position.set(0, floorElevUnits + ch - trimH / 2, 0);
          colGroup.add(capMesh);
        } else {
          // Round Column
          const r = cw / 2;
          const shaftGeo = new THREE.CylinderGeometry(r, r, ch, 24);
          const shaftMesh = new THREE.Mesh(shaftGeo, columnMat);
          shaftMesh.position.set(0, cy, 0);
          shaftMesh.castShadow = true;
          shaftMesh.receiveShadow = true;
          colGroup.add(shaftMesh);

          const trimH = ch * 0.04;
          const trimGeo = new THREE.CylinderGeometry(r * 1.15, r * 1.15, trimH, 24);
          const baseMesh = new THREE.Mesh(trimGeo, columnMat);
          baseMesh.position.set(0, floorElevUnits + trimH / 2, 0);
          colGroup.add(baseMesh);

          const capMesh = new THREE.Mesh(trimGeo, columnMat);
          capMesh.position.set(0, floorElevUnits + ch - trimH / 2, 0);
          colGroup.add(capMesh);
        }
        columnsGroup.add(colGroup);
      }

      // 3. Build Staircases
      for (const stair of floor.stairs || []) {
        const stairMeshGroup = build3DStairMesh(stair, floorElevUnits);
        stairsGroup.add(stairMeshGroup);
      }

      // 4. Build 3D Walls with Openings, Baseboard Moldings & Architectural Joinery
      for (const wall of floor.walls) {
        const isSelected = wall.id === selectedWallId;
        let mat = isSelected ? wallSelectedMat : wallDefaultMat;
        if (!isSelected && wall.materialInteriorId) {
          const customMat = (project.materials || DEFAULT_MATERIALS).find(
            (m) => m.id === wall.materialInteriorId
          );
          if (customMat) {
            mat = new THREE.MeshStandardMaterial({
              color: customMat.color,
              roughness: customMat.roughness,
              metalness: customMat.metalness,
            });
          }
        }

        const wallLenUnits = sixteenthsToThreeUnits(wallLength(wall));
        const wallThickUnits = sixteenthsToThreeUnits(wall.thickness);
        const wallHeightUnits = sixteenthsToThreeUnits(wall.height);

        if (wallLenUnits <= 0.01) continue;

        const angle = wallAngle(wall);
        const startX = sixteenthsToThreeUnits(wall.start.x);
        const startZ = -sixteenthsToThreeUnits(wall.start.y);

        const baseboardH = 0.11;
        const baseboardThick = wallThickUnits + 0.02;

        if (wall.openings.length === 0) {
          const wallGeo = new THREE.BoxGeometry(wallLenUnits, wallHeightUnits, wallThickUnits);
          const wallMesh = new THREE.Mesh(wallGeo, mat);
          wallMesh.userData = { wallId: wall.id };

          const midX = startX + (Math.cos(angle) * wallLenUnits) / 2;
          const midZ = startZ - (Math.sin(angle) * wallLenUnits) / 2;
          const midY = floorElevUnits + wallHeightUnits / 2;

          wallMesh.position.set(midX, midY, midZ);
          wallMesh.rotation.y = -angle;
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          wallsGroup.add(wallMesh);

          // Architectural Baseboard Skirting
          const baseGeo = new THREE.BoxGeometry(wallLenUnits, baseboardH, baseboardThick);
          const baseMesh = new THREE.Mesh(baseGeo, baseboardMat);
          baseMesh.position.set(midX, floorElevUnits + baseboardH / 2, midZ);
          baseMesh.rotation.y = -angle;
          wallsGroup.add(baseMesh);
        } else {
          const sortedOps = [...wall.openings].sort((a, b) => a.offsetAlongWall - b.offsetAlongWall);
          let curOffsetUnits = 0;

          for (const op of sortedOps) {
            const opOffsetUnits = sixteenthsToThreeUnits(op.offsetAlongWall);
            const opWidthUnits = sixteenthsToThreeUnits(op.width);
            const opHeightUnits = sixteenthsToThreeUnits(op.height);
            const opElevUnits = sixteenthsToThreeUnits(op.elevation);

            const opStartUnits = Math.max(0, opOffsetUnits - opWidthUnits / 2);
            const opEndUnits = Math.min(wallLenUnits, opOffsetUnits + opWidthUnits / 2);

            const segLen = opStartUnits - curOffsetUnits;
            if (segLen > 0.05) {
              const segGeo = new THREE.BoxGeometry(segLen, wallHeightUnits, wallThickUnits);
              const segMesh = new THREE.Mesh(segGeo, mat);
              segMesh.userData = { wallId: wall.id };
              const centerDist = curOffsetUnits + segLen / 2;
              const segX = startX + Math.cos(angle) * centerDist;
              const segZ = startZ - Math.sin(angle) * centerDist;
              segMesh.position.set(segX, floorElevUnits + wallHeightUnits / 2, segZ);
              segMesh.rotation.y = -angle;
              segMesh.castShadow = true;
              segMesh.receiveShadow = true;
              wallsGroup.add(segMesh);

              // Baseboard along segment
              const bGeo = new THREE.BoxGeometry(segLen, baseboardH, baseboardThick);
              const bMesh = new THREE.Mesh(bGeo, baseboardMat);
              bMesh.position.set(segX, floorElevUnits + baseboardH / 2, segZ);
              bMesh.rotation.y = -angle;
              wallsGroup.add(bMesh);
            }

            if (opElevUnits > 0.05) {
              const subGeo = new THREE.BoxGeometry(opWidthUnits, opElevUnits, wallThickUnits);
              const subMesh = new THREE.Mesh(subGeo, mat);
              subMesh.userData = { wallId: wall.id };
              const subX = startX + Math.cos(angle) * opOffsetUnits;
              const subZ = startZ - Math.sin(angle) * opOffsetUnits;
              subMesh.position.set(subX, floorElevUnits + opElevUnits / 2, subZ);
              subMesh.rotation.y = -angle;
              subMesh.castShadow = true;
              subMesh.receiveShadow = true;
              wallsGroup.add(subMesh);

              // Baseboard below opening
              const bGeo = new THREE.BoxGeometry(opWidthUnits, baseboardH, baseboardThick);
              const bMesh = new THREE.Mesh(bGeo, baseboardMat);
              bMesh.position.set(subX, floorElevUnits + baseboardH / 2, subZ);
              bMesh.rotation.y = -angle;
              wallsGroup.add(bMesh);
            }

            const lintelHeight = wallHeightUnits - (opElevUnits + opHeightUnits);
            if (lintelHeight > 0.05) {
              const lintelGeo = new THREE.BoxGeometry(opWidthUnits, lintelHeight, wallThickUnits);
              const lintelMesh = new THREE.Mesh(lintelGeo, mat);
              lintelMesh.userData = { wallId: wall.id };
              const lintelX = startX + Math.cos(angle) * opOffsetUnits;
              const lintelZ = startZ - Math.sin(angle) * opOffsetUnits;
              const lintelY = floorElevUnits + opElevUnits + opHeightUnits + lintelHeight / 2;
              lintelMesh.position.set(lintelX, lintelY, lintelZ);
              lintelMesh.rotation.y = -angle;
              lintelMesh.castShadow = true;
              lintelMesh.receiveShadow = true;
              wallsGroup.add(lintelMesh);
            }

            // Architectural Openings (Windows, Doors, Ventilators)
            const opCenterX = startX + Math.cos(angle) * opOffsetUnits;
            const opCenterZ = startZ - Math.sin(angle) * opOffsetUnits;

            if (op.type === 'window') {
              // Architectural Black Aluminum Window Casing Frame
              const frameThick = 0.045;
              const frameDepth = wallThickUnits + 0.02;
              const winGroup = new THREE.Group();
              winGroup.position.set(opCenterX, floorElevUnits + opElevUnits + opHeightUnits / 2, opCenterZ);
              winGroup.rotation.y = -angle;

              // Top & bottom horizontal rails
              const hRailGeo = new THREE.BoxGeometry(opWidthUnits, frameThick, frameDepth);
              const topRail = new THREE.Mesh(hRailGeo, windowFrameMat);
              topRail.position.set(0, opHeightUnits / 2 - frameThick / 2, 0);
              winGroup.add(topRail);

              const btmRail = new THREE.Mesh(hRailGeo, windowFrameMat);
              btmRail.position.set(0, -opHeightUnits / 2 + frameThick / 2, 0);
              winGroup.add(btmRail);

              // Left & right vertical stiles
              const vStileGeo = new THREE.BoxGeometry(frameThick, opHeightUnits - 2 * frameThick, frameDepth);
              const lStile = new THREE.Mesh(vStileGeo, windowFrameMat);
              lStile.position.set(-opWidthUnits / 2 + frameThick / 2, 0, 0);
              winGroup.add(lStile);

              const rStile = new THREE.Mesh(vStileGeo, windowFrameMat);
              rStile.position.set(opWidthUnits / 2 - frameThick / 2, 0, 0);
              winGroup.add(rStile);

              // Center vertical muntin divider bar
              const centerMuntin = new THREE.Mesh(
                new THREE.BoxGeometry(frameThick * 0.7, opHeightUnits - 2 * frameThick, frameDepth * 0.75),
                windowFrameMat
              );
              centerMuntin.position.set(0, 0, 0);
              winGroup.add(centerMuntin);

              // Interior Stone Window Sill Shelf
              const sillGeo = new THREE.BoxGeometry(opWidthUnits + 0.08, 0.035, wallThickUnits + 0.08);
              const sillMesh = new THREE.Mesh(sillGeo, windowSillMat);
              sillMesh.position.set(0, -opHeightUnits / 2 - 0.015, 0.03);
              winGroup.add(sillMesh);

              // Double-Glazed Translucent Architectural Glass
              const glassGeo = new THREE.BoxGeometry(opWidthUnits - 2 * frameThick, opHeightUnits - 2 * frameThick, 0.015);
              const glassMesh = new THREE.Mesh(glassGeo, windowGlassMat);
              glassMesh.position.set(0, 0, 0);
              winGroup.add(glassMesh);

              wallsGroup.add(winGroup);
            } else if (op.type === 'door') {
              // Architectural Door Casing & Semi-Ajar Door Leaf
              const doorGroup = new THREE.Group();
              doorGroup.position.set(opCenterX, floorElevUnits + opElevUnits, opCenterZ);
              doorGroup.rotation.y = -angle;

              // Top jamb
              const topJamb = new THREE.Mesh(new THREE.BoxGeometry(opWidthUnits, 0.04, wallThickUnits + 0.02), doorJambMat);
              topJamb.position.set(0, opHeightUnits - 0.02, 0);
              doorGroup.add(topJamb);

              // Side jambs
              const sideJambGeo = new THREE.BoxGeometry(0.04, opHeightUnits, wallThickUnits + 0.02);
              const lJamb = new THREE.Mesh(sideJambGeo, doorJambMat);
              lJamb.position.set(-opWidthUnits / 2 + 0.02, opHeightUnits / 2, 0);
              doorGroup.add(lJamb);

              const rJamb = new THREE.Mesh(sideJambGeo, doorJambMat);
              rJamb.position.set(opWidthUnits / 2 - 0.02, opHeightUnits / 2, 0);
              doorGroup.add(rJamb);

              // Door leaf swung 90° when open, closed when false
              const doorW = opWidthUnits - 0.06;
              const doorH = opHeightUnits - 0.04;
              const leafPivot = new THREE.Group();
              leafPivot.position.set(-opWidthUnits / 2 + 0.03, 0, 0);
              leafPivot.rotation.y = op.isOpen ? 1.57 : 0;

              const leafGeo = new THREE.BoxGeometry(doorW, doorH, 0.04);
              const leafMesh = new THREE.Mesh(leafGeo, doorPanelMat);
              leafMesh.position.set(doorW / 2, doorH / 2, 0);
              leafMesh.castShadow = true;
              leafMesh.userData = { type: 'door', wallId: wall.id, openingId: op.id };
              leafPivot.add(leafMesh);

              // Brass Lever Handle on door
              const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12), brassHardwareMat);
              handleStem.rotation.x = Math.PI / 2;
              handleStem.position.set(doorW - 0.08, doorH * 0.48, 0.03);
              leafPivot.add(handleStem);

              const handleLever = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.015), brassHardwareMat);
              handleLever.position.set(doorW - 0.03, doorH * 0.48, 0.045);
              leafPivot.add(handleLever);

              doorGroup.add(leafPivot);
              wallsGroup.add(doorGroup);
            } else if (op.type === 'ventilator') {
              const ventGlassGeo = new THREE.BoxGeometry(opWidthUnits - 0.05, opHeightUnits - 0.05, 0.04);
              const ventMesh = new THREE.Mesh(ventGlassGeo, windowGlassMat);
              ventMesh.position.set(opCenterX, floorElevUnits + opElevUnits + opHeightUnits / 2, opCenterZ);
              ventMesh.rotation.y = -angle;
              wallsGroup.add(ventMesh);
            }

            curOffsetUnits = opEndUnits;
          }

          const remainingLen = wallLenUnits - curOffsetUnits;
          if (remainingLen > 0.05) {
            const endGeo = new THREE.BoxGeometry(remainingLen, wallHeightUnits, wallThickUnits);
            const endMesh = new THREE.Mesh(endGeo, mat);
            const centerDist = curOffsetUnits + remainingLen / 2;
            const endX = startX + Math.cos(angle) * centerDist;
            const endZ = startZ - Math.sin(angle) * centerDist;
            endMesh.position.set(endX, floorElevUnits + wallHeightUnits / 2, endZ);
            endMesh.rotation.y = -angle;
            endMesh.castShadow = true;
            endMesh.receiveShadow = true;
            wallsGroup.add(endMesh);

            // Baseboard along remaining length
            const bGeo = new THREE.BoxGeometry(remainingLen, baseboardH, baseboardThick);
            const bMesh = new THREE.Mesh(bGeo, baseboardMat);
            bMesh.position.set(endX, floorElevUnits + baseboardH / 2, endZ);
            bMesh.rotation.y = -angle;
            wallsGroup.add(bMesh);
          }
        }
      }

      // Interior Spotlights & Ceiling Downlights (Night / Evening Mode)
      const isNightOrEvening = lightingMode === 'night' || sunTime < 7.0 || sunTime > 18.0;
      if (interiorLightsGroup && isNightOrEvening) {
        const ceilY = sixteenthsToThreeUnits(floor.elevation + floor.ceilingHeight);
        // Room Center Downlights
        for (const room of floor.rooms) {
          if (room.polygon.length < 3) continue;
          const cx = sixteenthsToThreeUnits(room.polygon.reduce((a, p) => a + p.x, 0) / room.polygon.length);
          const cz = -sixteenthsToThreeUnits(room.polygon.reduce((a, p) => a + p.y, 0) / room.polygon.length);

          const spot = new THREE.SpotLight('#fde68a', 2.2, 16, 0.75, 0.8, 1.8);
          spot.position.set(cx, ceilY - 0.05, cz);
          spot.target.position.set(cx, 0, cz);
          spot.castShadow = true;
          spot.shadow.bias = -0.0005;

          const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
          const fixtureMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fde68a', emissiveIntensity: 1.2 });
          const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
          fixture.position.set(cx, ceilY - 0.01, cz);

          interiorLightsGroup.add(spot);
          interiorLightsGroup.add(spot.target);
          interiorLightsGroup.add(fixture);
        }

        // Dedicated Architectural Ceiling Light Points from MEP layer
        for (const sym of floor.symbols || []) {
          if (sym.type === 'light_point') {
            const lx = sixteenthsToThreeUnits(sym.position.x);
            const lz = -sixteenthsToThreeUnits(sym.position.y);
            const ly = floorElevUnits + sixteenthsToThreeUnits(sym.elevation);

            const ptLight = new THREE.PointLight('#fef08a', 2.0, 14, 1.6);
            ptLight.position.set(lx, ly - 0.06, lz);
            ptLight.castShadow = true;
            ptLight.shadow.bias = -0.0004;

            const fixtureGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
            const fixtureMat = new THREE.MeshStandardMaterial({
              color: '#ffffff',
              emissive: '#fef08a',
              emissiveIntensity: 1.8,
            });
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            fixture.position.set(lx, ly - 0.01, lz);

            interiorLightsGroup.add(ptLight);
            interiorLightsGroup.add(fixture);
          }
        }
      }
    }

    // 5. Build 3D Roof on top floor (if present and visible)
    if (localShowRoof && project.floors.length > 0) {
      const topFloor = [...project.floors].sort((a, b) => b.levelIndex - a.levelIndex)[0];
      if (topFloor?.roof && topFloor.roof.visible !== false) {
        const roof3DMesh = build3DRoofMesh(
          topFloor.roof,
          topFloor.walls,
          sixteenthsToThreeUnits(topFloor.elevation),
          sixteenthsToThreeUnits(topFloor.ceilingHeight)
        );
        roofGroup.add(roof3DMesh);
      }
    }

    // 6. Build 3D Furniture & Built-in Fixtures
    const furnitureGroup = furnitureGroupRef.current;
    if (furnitureGroup) {
      clearGroup(furnitureGroup);
      for (const floor of project.floors) {
        const floorElevUnits = sixteenthsToThreeUnits(floor.elevation);
        for (const furn of floor.furniture || []) {
          const furnMesh = build3DFurnitureMesh(furn, floorElevUnits);
          furnitureGroup.add(furnMesh);
        }
        for (const kitchen of floor.kitchens || []) {
          const kitchenMesh = build3DKitchenMesh(kitchen, floorElevUnits);
          furnitureGroup.add(kitchenMesh);
        }
      }
    }

    // 7. Build 3D Site Plan & Landscape Elements (Lawn, Pool, Deck, Driveway, Trees, Fences)
    const siteGroup = siteGroupRef.current;
    if (siteGroup) {
      clearGroup(siteGroup);
      if (project.site && project.settings.showSitePlan !== false) {
        build3DSiteFeatures(
          project.site,
          siteGroup,
          lightingMode === 'night' || sunTime < 6.0 || sunTime > 18.5
        );
      }
    }
  }, [project, selectedWallId, localShowRoof, floorStyle, lightingMode, sunTime]);

  // Mouse Orbit & Pan Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    setIsMouseDown(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (viewModeRef.current === 'walk') {
      const walk = walkStateRef.current;
      walk.yaw -= deltaX * 0.005;
      walk.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, walk.pitch - deltaY * 0.005));
      if (onWalkCameraMove) {
        onWalkCameraMove({
          x: threeUnitsToSixteenths(walk.position.x),
          y: -threeUnitsToSixteenths(walk.position.z),
          yaw: walk.yaw,
        });
      }
      return;
    }

    const isPan =
      navToolRef.current === 'pan' ||
      dragButtonRef.current === 2 || // Right click
      dragButtonRef.current === 1 || // Middle click
      e.shiftKey ||                  // Shift + Left Drag
      e.altKey;                      // Option/Alt + Left Drag

    if (isPan) {
      panCamera(deltaX, deltaY);
    } else {
      const { spherical } = orbitStateRef.current;
      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.007));
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    isDraggingRef.current = false;
    setIsMouseDown(false);

    if (e && mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.hypot(dx, dy) < 5) {
        const mount = mountRef.current;
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        if (mount && camera && scene) {
          const rect = mount.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          let hitDoor: { wallId: string; openingId: string } | null = null;
          let hitWallId: string | null = null;
          for (const hit of intersects) {
            let cur: THREE.Object3D | null = hit.object;
            while (cur) {
              if (cur.userData?.type === 'door' && cur.userData?.openingId) {
                hitDoor = { wallId: cur.userData.wallId, openingId: cur.userData.openingId };
                break;
              }
              if (cur.userData?.wallId) {
                hitWallId = cur.userData.wallId;
                break;
              }
              cur = cur.parent;
            }
            if (hitDoor || hitWallId) break;
          }

          if (hitDoor && onToggleDoorOpen) {
            onToggleDoorOpen(hitDoor.wallId, hitDoor.openingId);
          } else if (hitWallId && onSelectWall) {
            onSelectWall(hitWallId);
          }
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey || navToolRef.current === 'pan') {
      panCamera(e.deltaX, e.deltaY);
    } else {
      const zoomFactor = Math.pow(1.002, e.deltaY);
      orbitStateRef.current.spherical.radius = Math.max(
        3,
        Math.min(250, orbitStateRef.current.spherical.radius * zoomFactor)
      );
    }
  };

  // Double click anywhere in the 3D scene to focus the orbit target on that exact point
  const handleDoubleClick = (e: React.MouseEvent) => {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!mount || !camera || !scene) return;

    const rect = mount.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    const hit = intersects.find((i) => i.object.type === 'Mesh' && i.point.y >= -0.1);
    if (hit) {
      orbitStateRef.current.target.set(hit.point.x, Math.max(0.5, hit.point.y), hit.point.z);
    }
  };

  const setPresetView = (preset: 'perspective' | 'top' | 'front') => {
    const { center, radius } = getProjectCenter(project);
    const { spherical, target } = orbitStateRef.current;
    target.copy(center);

    if (preset === 'perspective') {
      spherical.radius = radius;
      spherical.theta = Math.PI / 4;
      spherical.phi = Math.PI / 3;
    } else if (preset === 'top') {
      spherical.radius = radius * 1.25;
      spherical.theta = 0;
      spherical.phi = 0.05;
    } else if (preset === 'front') {
      spherical.radius = radius;
      spherical.theta = 0;
      spherical.phi = Math.PI / 2.05;
    }
  };

  // High-Resolution 8K / 4K / 1080p Master Capture Engine
  const handleCaptureRender = useCallback(
    async (res: '1080p' | '4k' | '8k', settings: RenderSettings): Promise<string | null> => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!scene || !camera) return null;

      let targetW = 1920;
      let targetH = 1080;
      if (res === '4k') {
        targetW = 3840;
        targetH = 2160;
      } else if (res === '8k') {
        targetW = 7680;
        targetH = 4320;
      }

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;

      const offscreenRenderer = new THREE.WebGLRenderer({
        canvas: offscreenCanvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      offscreenRenderer.setSize(targetW, targetH, false);
      offscreenRenderer.shadowMap.enabled = true;
      offscreenRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      offscreenRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      offscreenRenderer.toneMappingExposure = settings.exposure;

      const prevAspect = camera.aspect;
      camera.aspect = targetW / targetH;
      camera.updateProjectionMatrix();

      offscreenRenderer.render(scene, camera);

      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();

      const dataUrl = offscreenCanvas.toDataURL('image/png', 1.0);
      offscreenRenderer.dispose();
      return dataUrl;
    },
    []
  );

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#141721',
      }}
    >
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: '100%',
          height: '100%',
          cursor:
            localViewMode === 'walk'
              ? 'crosshair'
              : isMouseDown
              ? 'grabbing'
              : navTool === 'pan'
              ? 'grab'
              : 'grab',
        }}
      />

      {/* Streamlined Modern 3D Viewport Floating HUD */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: '4px 8px',
          zIndex: 30,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Navigation Mode: Rotate vs Pan */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 2 }}>
          <button
            onClick={() => setNavTool('orbit')}
            title="Rotate / Orbit (Click & drag to rotate)"
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 14,
              background: navTool === 'orbit' ? 'var(--accent-blue)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            🔄 Orbit
          </button>
          <button
            onClick={() => setNavTool('pan')}
            title="Pan / Drag (Click & drag to slide across)"
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 14,
              background: navTool === 'pan' ? 'var(--accent-blue)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ✋ Pan
          </button>
        </div>

        {/* Center / Fit House */}
        <button
          onClick={fitToHouse}
          title="Center House (F)"
          style={{
            padding: '4px 7px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          🎯 Fit
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Camera Angles */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { id: 'perspective', label: '3D' },
            { id: 'top', label: 'Top' },
            { id: 'front', label: 'Front' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setPresetView(v.id as any)}
              style={{
                padding: '4px 7px',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Lighting Atmosphere Selector */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 2 }}>
          <button
            onClick={() => setLightingMode('daylight')}
            title="Daylight"
            style={{
              padding: '3px 6px',
              fontSize: 11,
              borderRadius: 12,
              background: lightingMode === 'daylight' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
              color: lightingMode === 'daylight' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ☀️
          </button>
          <button
            onClick={() => setLightingMode('golden')}
            title="Sunset Golden Hour"
            style={{
              padding: '3px 6px',
              fontSize: 11,
              borderRadius: 12,
              background: lightingMode === 'golden' ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
              color: lightingMode === 'golden' ? '#fbbf24' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🌅
          </button>
          <button
            onClick={() => setLightingMode('night')}
            title="Night Spotlights"
            style={{
              padding: '3px 6px',
              fontSize: 11,
              borderRadius: 12,
              background: lightingMode === 'night' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              color: lightingMode === 'night' ? '#a5b4fc' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🌙
          </button>
        </div>

        {/* Sun Time of Day Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '3px 8px',
          }}
          title={`Sun Position: ${formatSunHour(sunTime)}`}
        >
          <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap' }}>
            ☀️ {formatSunHour(sunTime)}
          </span>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={sunTime}
            onChange={(e) => setSunTime(parseFloat(e.target.value))}
            style={{ width: 68, accentColor: '#38bdf8', cursor: 'pointer', height: 4 }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Roof Toggle */}
        <button
          onClick={() => {
            const next = !localShowRoof;
            setLocalShowRoof(next);
            if (onToggleShowRoof) onToggleShowRoof();
          }}
          title="Toggle Roof Visibility"
          style={{
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 6,
            background: localShowRoof ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            color: localShowRoof ? '#60a5fa' : '#cbd5e1',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {localShowRoof ? 'Roof: On' : 'Roof: Off'}
        </button>

        {/* Dollhouse Cut Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: dollhouseCut < 100 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '2px 8px',
          }}
          title="Dollhouse Horizontal Section Cutout"
        >
          <span style={{ fontSize: 11, color: dollhouseCut < 100 ? '#38bdf8' : '#cbd5e1', fontWeight: 600 }}>
            ✂️ {dollhouseCut === 100 ? 'Full' : `${dollhouseCut}%`}
          </span>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={dollhouseCut}
            onChange={(e) => setDollhouseCut(Number(e.target.value))}
            style={{ width: 56, accentColor: '#38bdf8', cursor: 'pointer', height: 4 }}
          />
        </div>

        {/* Walk Mode Toggle */}
        <button
          onClick={() => {
            const next = localViewMode === 'orbit' ? 'walk' : 'orbit';
            setLocalViewMode(next);
            if (onToggleViewMode) onToggleViewMode(next);
          }}
          title="First-Person Walk Mode (WASD)"
          style={{
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 6,
            background: localViewMode === 'walk' ? '#059669' : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {localViewMode === 'walk' ? '🚶 Walking' : '🚶 Walk'}
        </button>

        {/* 8K Ultra Render Studio Action Button */}
        <button
          onClick={() => setIsRenderStudioOpen(true)}
          title="Open 8K Architectural Ultra Render Studio"
          style={{
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #ec4899, #6366f1)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>✨ 8K Render</span>
        </button>

        {/* Refresh 3D */}
        {onUpdate3D && (
          <button
            onClick={onUpdate3D}
            title="Sync 3D Model"
            style={{
              padding: '4px 6px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ⚡
          </button>
        )}
      </div>

      {/* Minimal Navigation Hint Bar at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '4px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11,
          color: '#94a3b8',
          zIndex: 25,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span>
          <strong style={{ color: navTool === 'pan' ? '#38bdf8' : '#60a5fa' }}>
            {navTool === 'orbit' ? 'Rotate Mode' : 'Pan Mode'}
          </strong>
          : Left-Drag to {navTool === 'orbit' ? 'Rotate' : 'Pan'}
        </span>
        <span>•</span>
        <span>Shift+Drag to Pan</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
        <span>•</span>
        <span>F to Center</span>
      </div>

      {/* Live First-Person Walk Mini-Map Radar */}
      {localViewMode === 'walk' && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            width: 180,
            height: 180,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'rgba(9, 13, 22, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
            zIndex: 35,
          }}
        >
          <canvas
            ref={miniMapCanvasRef}
            width={180}
            height={180}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* 8K Architectural Render Studio Modal */}
      <RenderStudioModal
        isOpen={isRenderStudioOpen}
        onClose={() => setIsRenderStudioOpen(false)}
        lightingMode={lightingMode}
        onChangeLightingMode={setLightingMode}
        floorStyle={floorStyle}
        onChangeFloorStyle={setFloorStyle}
        onCaptureRender={handleCaptureRender}
      />
    </div>
  );
};

