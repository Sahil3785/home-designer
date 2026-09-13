import { Sixteenths } from '../units';
import { Point2D, ReferencePlan } from './types';

/**
 * Creates an uncalibrated ReferencePlan instance from an imported image.
 */
export function createDefaultReferencePlan(
  floorId: string,
  fileName: string,
  imageUrl: string,
  naturalWidth: number,
  naturalHeight: number
): ReferencePlan {
  // Default scale: 1 pixel = 1 inch (16 sixteenths)
  const defaultScale = 16;
  const width = Math.round(naturalWidth * defaultScale);
  const height = Math.round(naturalHeight * defaultScale);

  return {
    id: `ref_plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    floorId,
    fileName,
    imageUrl,
    // Center initially around (0, 0)
    x: -Math.round(width / 2),
    y: Math.round(height / 2),
    width,
    height,
    naturalWidth,
    naturalHeight,
    scale: defaultScale,
    opacity: 0.6,
    isLocked: false,
    isVisible: true,
    isCalibrated: false,
  };
}

/**
 * Calculates straight-line distance between two 2D points in sixteenths.
 */
export function getPointDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

/**
 * Calibrates a reference plan using two user-clicked CAD points and a known real distance.
 * Anchors around p1 so the picked feature stays under the user's cursor.
 */
export function calibrateReferencePlan(
  plan: ReferencePlan,
  p1: Point2D,
  p2: Point2D,
  knownDistance: Sixteenths
): ReferencePlan {
  const currentWorldDist = getPointDistance(p1, p2);
  if (currentWorldDist <= 0 || knownDistance <= 0) return plan;

  // Calculate distance in original image pixels
  const pixelDist = currentWorldDist / (plan.scale || 16);
  if (pixelDist <= 0) return plan;

  // New scale: sixteenths per image pixel
  const newScale = knownDistance / pixelDist;
  const newWidth = Math.round(plan.naturalWidth * newScale);
  const newHeight = Math.round(plan.naturalHeight * newScale);

  // Preserve anchor position at p1
  const relXFrac = plan.width !== 0 ? (p1.x - plan.x) / plan.width : 0.5;
  const relYFrac = plan.height !== 0 ? (plan.y - p1.y) / plan.height : 0.5;

  const newX = Math.round(p1.x - relXFrac * newWidth);
  const newY = Math.round(p1.y + relYFrac * newHeight);

  return {
    ...plan,
    scale: newScale,
    width: newWidth,
    height: newHeight,
    x: newX,
    y: newY,
    isCalibrated: true,
    calibrationData: {
      p1,
      p2,
      knownDistance,
    },
  };
}

/**
 * Converts CAD world coordinate to image pixel coordinate (0 to naturalWidth/Height).
 */
export function worldToImagePixel(point: Point2D, plan: ReferencePlan): { x: number; y: number } {
  if (plan.width <= 0 || plan.height <= 0) return { x: 0, y: 0 };
  const u = (point.x - plan.x) / plan.width;
  const v = (plan.y - point.y) / plan.height;
  return {
    x: u * plan.naturalWidth,
    y: v * plan.naturalHeight,
  };
}

/**
 * Converts image pixel coordinate to CAD world coordinate.
 */
export function imagePixelToWorld(pixel: { x: number; y: number }, plan: ReferencePlan): Point2D {
  const u = pixel.x / plan.naturalWidth;
  const v = pixel.y / plan.naturalHeight;
  return {
    x: Math.round(plan.x + u * plan.width),
    y: Math.round(plan.y - v * plan.height),
  };
}
