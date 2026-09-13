import * as THREE from 'three';
import { FlooringConfig } from './types';

export type FloorStyle = 'oak' | 'marble' | 'walnut' | 'tile' | 'pvc' | 'matte';

// Cache generated textures so we don't recreate canvases on every render
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generates a realistic seamless European White Oak plank hardwood texture.
 */
export function getOakFloorTexture(): THREE.CanvasTexture {
  if (textureCache.has('oak')) {
    return textureCache.get('oak')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base warm honey oak
  ctx.fillStyle = '#bfa175';
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw 8 horizontal plank rows
  const numPlanks = 8;
  const plankH = 1024 / numPlanks;
  const tones = ['#c5a378', '#baa075', '#d0ad82', '#b6976a', '#ceab80', '#bd9f72', '#cbab7e', '#b8996b'];

  for (let r = 0; r < numPlanks; r++) {
    const y = r * plankH;
    ctx.fillStyle = tones[r % tones.length];
    ctx.fillRect(0, y, 1024, plankH);

    // Staggered vertical end joints
    const jointOffset = (r % 2 === 0 ? 0 : 340) + ((r * 180) % 1024);
    const jointX1 = jointOffset % 1024;
    const jointX2 = (jointOffset + 512) % 1024;

    // Wood grain streaks
    for (let g = 0; g < 45; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(95, 65, 30, 0.08)' : 'rgba(255, 235, 195, 0.06)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(300, gy + (Math.random() - 0.5) * 6, 700, gy + (Math.random() - 0.5) * 6, 1024, gy);
      ctx.stroke();
    }

    // Micro wood pores
    for (let p = 0; p < 80; p++) {
      const px = Math.random() * 1024;
      const py = y + Math.random() * plankH;
      ctx.fillStyle = 'rgba(70, 45, 20, 0.06)';
      ctx.fillRect(px, py, 2 + Math.random() * 4, 1);
    }

    // Dark V-groove shadow between planks
    ctx.fillStyle = 'rgba(50, 32, 14, 0.35)';
    ctx.fillRect(0, y + plankH - 3, 1024, 3);
    ctx.fillStyle = 'rgba(255, 240, 210, 0.15)';
    ctx.fillRect(0, y, 1024, 1.5);

    // Vertical butt joints
    [jointX1, jointX2].forEach((jx) => {
      ctx.fillStyle = 'rgba(50, 32, 14, 0.35)';
      ctx.fillRect(jx - 1, y, 2, plankH);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.35, 0.35); // Realistic scale: ~8" wide planks
  textureCache.set('oak', texture);
  return texture;
}

/**
 * Generates an ultra-luxury polished Italian Calacatta Gold Marble texture with organic grey and gold veining.
 */
export function getMarbleFloorTexture(): THREE.CanvasTexture {
  if (textureCache.has('marble')) {
    return textureCache.get('marble')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Soft luminous white Carrara marble base
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#fafafc');
  grad.addColorStop(0.5, '#f4f5f8');
  grad.addColorStop(1, '#fcfdfd');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Organic diagonal grey & gold veins
  const drawVein = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    width: number,
    branches: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let curX = startX;
    let curY = startY;
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      const targetX = startX + ((endX - startX) * i) / steps + (Math.random() - 0.5) * 45;
      const targetY = startY + ((endY - startY) * i) / steps + (Math.random() - 0.5) * 45;
      ctx.lineTo(targetX, targetY);
      curX = targetX;
      curY = targetY;

      if (branches > 0 && Math.random() > 0.6) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX + (Math.random() - 0.5) * 120, curY + (Math.random() - 0.5) * 120);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(curX, curY);
      }
    }
    ctx.stroke();
  };

  // Primary charcoal/grey veins
  drawVein(40, 0, 950, 1024, 'rgba(100, 116, 139, 0.22)', 3.5, 4);
  drawVein(0, 320, 1024, 850, 'rgba(148, 163, 184, 0.18)', 2.8, 3);
  drawVein(250, 0, 1024, 520, 'rgba(100, 116, 139, 0.16)', 2.0, 2);

  // Fine gold/amber accent veining (Calacatta Gold signature)
  drawVein(80, 50, 900, 980, 'rgba(217, 119, 6, 0.25)', 2.2, 3);
  drawVein(0, 480, 800, 1024, 'rgba(180, 83, 9, 0.18)', 1.8, 2);

  // Soft misty grey clouding
  for (let c = 0; c < 12; c++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 1024;
    const rad = 60 + Math.random() * 140;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(226, 232, 240, 0.25)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Polished large-format tile seams (24" x 48" architectural proportion)
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.3, 0.3);
  textureCache.set('marble', texture);
  return texture;
}

/**
 * Generates a deep Smoked Walnut architectural hardwood texture.
 */
export function getWalnutFloorTexture(): THREE.CanvasTexture {
  if (textureCache.has('walnut')) {
    return textureCache.get('walnut')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep rich walnut base
  ctx.fillStyle = '#4a3628';
  ctx.fillRect(0, 0, 1024, 1024);

  const numPlanks = 8;
  const plankH = 1024 / numPlanks;
  const tones = ['#4e392b', '#443224', '#553e2e', '#3f2e21', '#513b2c', '#473427'];

  for (let r = 0; r < numPlanks; r++) {
    const y = r * plankH;
    ctx.fillStyle = tones[r % tones.length];
    ctx.fillRect(0, y, 1024, plankH);

    // Deep linear grain
    for (let g = 0; g < 40; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = 'rgba(25, 16, 10, 0.25)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1024, gy + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }

    // Shadow joint
    ctx.fillStyle = 'rgba(15, 10, 5, 0.6)';
    ctx.fillRect(0, y + plankH - 2.5, 1024, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.35, 0.35);
  textureCache.set('walnut', texture);
  return texture;
}

/**
 * Generates procedural Architectural Tile textures (large-format vitrified porcelain, terrazzo, Moroccan, hex mosaic).
 */
export function getTileFloorTexture(tilePresetId: string = 'mat_tile_large_format', config?: FlooringConfig): THREE.CanvasTexture {
  const cacheKey = `tile_${tilePresetId}_${config?.groutColor || 'grey'}_${config?.jointPattern || 'grid'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const groutColor = config?.groutColor === 'charcoal' ? '#334155' : config?.groutColor === 'light' ? '#f1f5f9' : '#94a3b8';

  if (tilePresetId === 'mat_tile_terrazzo') {
    // Terrazzo: light off-white base with colorful stone aggregate chips
    ctx.fillStyle = '#f3f2ee';
    ctx.fillRect(0, 0, 1024, 1024);

    const fleckColors = ['#292524', '#78716c', '#b45309', '#0284c7', '#059669', '#d97706', '#dc2626'];
    for (let i = 0; i < 600; i++) {
      const fx = Math.random() * 1024;
      const fy = Math.random() * 1024;
      const size = 2 + Math.random() * 8;
      ctx.fillStyle = fleckColors[Math.floor(Math.random() * fleckColors.length)];
      ctx.beginPath();
      if (Math.random() > 0.5) {
        ctx.arc(fx, fy, size / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(fx, fy, size, size * 0.7);
      }
      ctx.fill();
    }

    // Tile joint grid (4 large tiles)
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 1024, 1024);
    ctx.beginPath();
    ctx.moveTo(512, 0); ctx.lineTo(512, 1024);
    ctx.moveTo(0, 512); ctx.lineTo(1024, 512);
    ctx.stroke();
  } else if (tilePresetId === 'mat_tile_moroccan') {
    // Moroccan Encaustic Decorative Tiles (4 quadrant ornate pattern)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 1024);

    for (let qx = 0; qx < 2; qx++) {
      for (let qy = 0; qy < 2; qy++) {
        const ox = qx * 512 + 256;
        const oy = qy * 512 + 256;
        // Central decorative medallion
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(ox, oy, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(ox, oy, 40, 0, Math.PI * 2);
        ctx.fill();

        // 8 radiating petals
        for (let a = 0; a < 8; a++) {
          const angle = (a * Math.PI) / 4;
          const px = ox + Math.cos(angle) * 110;
          const py = oy + Math.sin(angle) * 110;
          ctx.fillStyle = a % 2 === 0 ? '#1e40af' : '#b45309';
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.fill();
        }

        // Geometric boundary box
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(qx * 512 + 20, qy * 512 + 20, 472, 472);
      }
    }

    // Grout lines
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 1024, 1024);
    ctx.beginPath();
    ctx.moveTo(512, 0); ctx.lineTo(512, 1024);
    ctx.moveTo(0, 512); ctx.lineTo(1024, 512);
    ctx.stroke();
  } else if (tilePresetId === 'mat_tile_hex_mosaic') {
    // Hexagonal porcelain mosaic
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 1024, 1024);

    const r = 40;
    const h = r * Math.sqrt(3);
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 2.5;

    for (let y = -h; y < 1024 + h; y += h) {
      for (let x = -r * 3; x < 1024 + r * 3; x += r * 3) {
        const centers = [
          { cx: x, cy: y },
          { cx: x + r * 1.5, cy: y + h / 2 },
        ];
        for (const { cx, cy } of centers) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = cx + (r - 2) * Math.cos(angle);
            const hy = cy + (r - 2) * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          // Subtle ceramic tone variation
          const shade = 245 + Math.floor((Math.sin(cx) + Math.cos(cy)) * 5);
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 2})`;
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  } else {
    // Large-Format Vitrified Porcelain (Sleek 2x2 grid with beveled edges)
    const baseColor = tilePresetId === 'mat_tile_slate_black' ? '#1e293b' : tilePresetId === 'mat_tile_porcelain_grey' ? '#cbd5e1' : '#f8fafc';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle micro-surface texture
    for (let s = 0; s < 4000; s++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Bevel highlights & shadow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, 1024, 2);
    ctx.fillRect(0, 514, 1024, 2);
    ctx.fillRect(0, 0, 2, 1024);
    ctx.fillRect(514, 0, 2, 1024);

    // Grout seams
    ctx.fillStyle = groutColor;
    ctx.fillRect(510, 0, 4, 1024);
    ctx.fillRect(0, 510, 1024, 4);
    ctx.strokeRect(0, 0, 1024, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.4, 0.4);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generates realistic Luxury Vinyl Tile (LVT) / SPC Rigid Core flooring texture.
 */
export function getPvcVinylTexture(pvcPresetId: string = 'mat_pvc_lvt_plank'): THREE.CanvasTexture {
  if (textureCache.has(pvcPresetId)) {
    return textureCache.get(pvcPresetId)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base tones depending on preset
  let baseTone = '#8A7B6E';
  let grainTone = 'rgba(45, 35, 25, 0.22)';
  if (pvcPresetId === 'mat_pvc_spc_ash') {
    baseTone = '#A2A49F';
    grainTone = 'rgba(60, 65, 65, 0.18)';
  } else if (pvcPresetId === 'mat_pvc_slate_tile') {
    baseTone = '#333D44';
    grainTone = 'rgba(20, 25, 30, 0.3)';
  }

  ctx.fillStyle = baseTone;
  ctx.fillRect(0, 0, 1024, 1024);

  // 10 plank rows
  const numPlanks = 10;
  const plankH = 1024 / numPlanks;
  for (let r = 0; r < numPlanks; r++) {
    const y = r * plankH;

    // Linear synthetic embossed wood grain
    for (let g = 0; g < 35; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = grainTone;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1024, gy + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }

    // Micro bevel V-groove
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, y + plankH - 2, 1024, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, y, 1024, 1);

    // Staggered end joints
    const jx = ((r * 340) + 180) % 1024;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(jx, y, 2, plankH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.35, 0.35);
  textureCache.set(pvcPresetId, texture);
  return texture;
}

/**
 * Generates an ultra-sleek architectural Matte Microcement / Concrete texture.
 */
export function getMatteConcreteTexture(mattePresetId: string = 'mat_concrete_microcement'): THREE.CanvasTexture {
  if (textureCache.has(mattePresetId)) {
    return textureCache.get(mattePresetId)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  let baseColor = '#C2BDB5'; // Warm raw microcement
  if (mattePresetId === 'mat_concrete_industrial') {
    baseColor = '#8D9094';
  } else if (mattePresetId === 'mat_matte_oak') {
    baseColor = '#D4BFA4';
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle hand-troweled sweep marks (organic radial gradients)
  for (let s = 0; s < 18; s++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 1024;
    const rad = 120 + Math.random() * 220;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro stipple mineral aggregate
  for (let p = 0; p < 8000; p++) {
    const px = Math.random() * 1024;
    const py = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.3, 0.3);
  textureCache.set(mattePresetId, texture);
  return texture;
}

