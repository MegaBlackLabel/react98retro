export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EscapePosition = {
  x: number;
  y: number;
};

const GAP = 8;
const DEFAULT_VIEWPORT_WIDTH = 1024;
const DEFAULT_VIEWPORT_HEIGHT = 768;

function getViewportSize(): { width: number; height: number } {
  const viewportWidth = typeof globalThis.innerWidth === 'number' ? globalThis.innerWidth : DEFAULT_VIEWPORT_WIDTH;
  const viewportHeight = typeof globalThis.innerHeight === 'number' ? globalThis.innerHeight : DEFAULT_VIEWPORT_HEIGHT;

  return { width: viewportWidth, height: viewportHeight };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampPosition(position: EscapePosition, windowRect: Rect, viewport: { width: number; height: number }): EscapePosition {
  return {
    x: clamp(position.x, 0, Math.max(0, viewport.width - windowRect.width)),
    y: clamp(position.y, 0, Math.max(0, viewport.height - windowRect.height)),
  };
}

function fitsViewport(position: EscapePosition, windowRect: Rect, viewport: { width: number; height: number }): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + windowRect.width <= viewport.width &&
    position.y + windowRect.height <= viewport.height
  );
}

export function isColliding(a: Rect, b: Rect): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) {
    return false;
  }

  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

export function calculateEscapePosition(snapWindow: Rect, otherWindow: Rect): EscapePosition {
  const viewport = getViewportSize();
  const candidates: EscapePosition[] = [
    { x: snapWindow.x + snapWindow.width + GAP, y: otherWindow.y },
    { x: otherWindow.x, y: snapWindow.y + snapWindow.height + GAP },
    { x: snapWindow.x - otherWindow.width - GAP, y: otherWindow.y },
    { x: otherWindow.x, y: snapWindow.y - otherWindow.height - GAP },
  ];

  const escapePosition = candidates.find((candidate) => fitsViewport(candidate, otherWindow, viewport));

  return escapePosition ?? clampPosition({ x: otherWindow.x, y: otherWindow.y }, otherWindow, viewport);
}

export function findCollisions(
  myGeometry: Rect,
  allGeometries: Record<string, Rect>,
): Array<{ id: string; escapePosition: EscapePosition }> {
  return Object.entries(allGeometries)
    .filter(([, geometry]) => isColliding(myGeometry, geometry))
    .map(([id, geometry]) => ({
      id,
      escapePosition: calculateEscapePosition(myGeometry, geometry),
    }));
}
