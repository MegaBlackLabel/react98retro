import type { CSSProperties } from 'react';
import { ICONS } from './icons';
import type { IconName, IconSize } from './icons';

export type IconProps = {
  name: IconName;
  size?: IconSize;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 16, alt = '', className, style }: IconProps) {
  return (
    <img
      src={ICONS[name]}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
      draggable={false}
    />
  );
}
