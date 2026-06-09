export type SnapZone =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type SnapTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
  zone: SnapZone;
};

export function getSnapTarget({
  pointerX,
  pointerY,
  viewportWidth,
  viewportHeight,
  threshold,
  minWidth,
  minHeight,
}: {
  pointerX: number;
  pointerY: number;
  viewportWidth: number;
  viewportHeight: number;
  threshold: number;
  minWidth: number;
  minHeight: number;
}): SnapTarget | null {
  const halfWidth = Math.floor(viewportWidth / 2);
  const halfHeight = Math.floor(viewportHeight / 2);

  const nearLeft = pointerX <= threshold;
  const nearRight = pointerX >= viewportWidth - threshold;
  const nearTop = pointerY <= threshold;
  const nearBottom = pointerY >= viewportHeight - threshold;

  let zone: SnapZone | null = null;

  if (nearTop && nearLeft) zone = 'top-left';
  else if (nearTop && nearRight) zone = 'top-right';
  else if (nearBottom && nearLeft) zone = 'bottom-left';
  else if (nearBottom && nearRight) zone = 'bottom-right';
  else if (nearLeft) zone = 'left';
  else if (nearRight) zone = 'right';
  else if (nearTop) zone = 'top';
  else if (nearBottom) zone = 'bottom';

  if (!zone) return null;

  const target =
    zone === 'left'
      ? { x: 0, y: 0, width: halfWidth, height: viewportHeight }
      : zone === 'right'
        ? { x: halfWidth, y: 0, width: viewportWidth - halfWidth, height: viewportHeight }
        : zone === 'top'
          ? { x: 0, y: 0, width: viewportWidth, height: halfHeight }
          : zone === 'bottom'
            ? { x: 0, y: halfHeight, width: viewportWidth, height: viewportHeight - halfHeight }
            : zone === 'top-left'
              ? { x: 0, y: 0, width: halfWidth, height: halfHeight }
              : zone === 'top-right'
                ? { x: halfWidth, y: 0, width: viewportWidth - halfWidth, height: halfHeight }
                : zone === 'bottom-left'
                  ? { x: 0, y: halfHeight, width: halfWidth, height: viewportHeight - halfHeight }
                  : { x: halfWidth, y: halfHeight, width: viewportWidth - halfWidth, height: viewportHeight - halfHeight };

  if (target.width < minWidth || target.height < minHeight) return null;

  return { ...target, zone };
}
