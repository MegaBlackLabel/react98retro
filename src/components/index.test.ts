import { describe, expect, it } from 'vitest';
import type { TableSortDirection, TableSortState } from './index';

describe('components barrel', () => {
  it('re-exports table sort types', () => {
    const direction: TableSortDirection = 'desc';
    const state: TableSortState<{ id: string }> = { columnKey: 'id', direction };

    expect(state.direction).toBe('desc');
  });
});
