import { describe, expect, it } from 'vitest';
import {
  Window,
  Button,
  Menu,
  SplitButton,
  ICONS,
  getFileIcon,
  Icon,
  useWindowManager,
  WindowManagerContext,
  useWindowManagerContext,
} from './index';

describe('root barrel', () => {
  it('exports Window component', () => {
    expect(Window).toBeDefined();
    expect(Window).not.toBeNull();
  });

  it('exports Button component', () => {
    expect(Button).toBeDefined();
    expect(Button).not.toBeNull();
  });

  it('exports Menu component', () => {
    expect(Menu).toBeDefined();
    expect(Menu).not.toBeNull();
  });

  it('exports SplitButton component', () => {
    expect(SplitButton).toBeDefined();
    expect(SplitButton).not.toBeNull();
  });

  it('exports ICONS object', () => {
    expect(typeof ICONS).toBe('object');
    expect(ICONS).toHaveProperty('hardDrive');
  });

  it('exports getFileIcon function', () => {
    expect(typeof getFileIcon).toBe('function');
  });

  it('exports Icon component', () => {
    expect(typeof Icon).toBe('function');
  });

  it('exports useWindowManager hook', () => {
    expect(typeof useWindowManager).toBe('function');
  });

  it('exports WindowManagerContext', () => {
    expect(WindowManagerContext).toBeDefined();
  });

  it('exports useWindowManagerContext hook', () => {
    expect(typeof useWindowManagerContext).toBe('function');
  });
});
