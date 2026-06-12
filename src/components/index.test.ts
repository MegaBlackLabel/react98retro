import { describe, expect, it } from 'vitest';
import type { TableSortDirection, TableSortState } from './index';
import {
  FieldRow,
  Win98Provider,
  Window,
  Button,
  Menu,
  SplitButton,
} from './index';

describe('components barrel', () => {
  it('re-exports table sort types', () => {
    const direction: TableSortDirection = 'desc';
    const state: TableSortState<{ id: string }> = { columnKey: 'id', direction };

    expect(state.direction).toBe('desc');
  });

  it('exports FieldRow', () => {
    expect(FieldRow).toBeDefined();
    expect(FieldRow).not.toBeNull();
  });

  it('exports Win98Provider', () => {
    expect(Win98Provider).toBeDefined();
    expect(Win98Provider).not.toBeNull();
  });

  it('exports Window', () => {
    expect(Window).toBeDefined();
    expect(Window).not.toBeNull();
  });

  it('exports Button', () => {
    expect(Button).toBeDefined();
    expect(Button).not.toBeNull();
  });

  it('exports Menu', () => {
    expect(Menu).toBeDefined();
    expect(Menu).not.toBeNull();
  });

  it('exports SplitButton', () => {
    expect(SplitButton).toBeDefined();
    expect(SplitButton).not.toBeNull();
  });
});
