import { describe, expect, it } from 'vitest';
import { ICONS, getFileIcon, Icon } from './index';

describe('icons barrel', () => {
  it('exports ICONS as an object', () => {
    expect(typeof ICONS).toBe('object');
    expect(ICONS).toHaveProperty('hardDrive');
    expect(ICONS).toHaveProperty('fileGeneric');
  });

  it('exports getFileIcon as a function', () => {
    expect(typeof getFileIcon).toBe('function');
  });

  it('exports Icon as a function', () => {
    expect(typeof Icon).toBe('function');
  });
});
