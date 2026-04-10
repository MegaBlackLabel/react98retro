import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TableView } from './TableView';
import type { TableColumn, TableSortDirection, TableSortState } from './index';

type Row = {
  id: string;
  name: string;
  size: string;
  type: string;
  modified: string;
};

describe('TableView', () => {
  const columns: readonly TableColumn<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'size', header: 'Size' },
  ];

  const rows: Row[] = [
    { id: '1', name: 'file.txt', size: '1 KB', type: 'Text', modified: 'Today' },
    { id: '2', name: 'other.txt', size: '2 KB', type: 'Text', modified: 'Yesterday' },
  ];

  it('renders column headers', () => {
    render(<TableView columns={columns} rows={rows} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<TableView columns={columns} rows={rows} />);

    expect(screen.getByText('file.txt')).toBeInTheDocument();
    expect(screen.getByText('other.txt')).toBeInTheDocument();
  });

  it('preserves string column widths', () => {
    render(<TableView columns={[{ key: 'name', header: 'Name', width: '40%' }]} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveStyle({ width: '40%' });
  });

  it('does not render a clickable sort button when sort is read-only', () => {
    render(
      <TableView
        columns={columns}
        rows={rows}
        sort={{ columnKey: 'name', direction: 'asc' }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveTextContent('Name');
  });

  it('clicking row calls onSelectionChange with row id', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <TableView columns={columns} rows={rows} onSelectionChange={onSelectionChange} />,
    );

    await user.click(screen.getByText('file.txt'));

    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('double-clicking row calls onRowDoubleClick', async () => {
    const user = userEvent.setup();
    const onRowDoubleClick = vi.fn();

    render(<TableView columns={columns} rows={rows} onRowDoubleClick={onRowDoubleClick} />);

    await user.dblClick(screen.getByText('file.txt'));

    expect(onRowDoubleClick).toHaveBeenCalledWith(rows[0]);
  });

  it("selected row has 'highlighted' class", () => {
    render(
      <TableView
        columns={columns}
        rows={rows}
        selectedIds={['1']}
      />,
    );

    expect(screen.getByText('file.txt').closest('tr')).toHaveClass('highlighted');
  });

  it('clicking a sortable header calls onSortChange with ascending direction first', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <TableView
        columns={columns}
        rows={rows}
        sort={{ columnKey: null, direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onSortChange).toHaveBeenCalledWith({ columnKey: 'name', direction: 'asc' });
  });

  it('does not show a visible sort indicator on the active sort column', () => {
    render(
      <TableView
        columns={columns}
        rows={rows}
        sort={{ columnKey: 'size', direction: 'desc' }}
        onSortChange={vi.fn()}
      />,
    );

    // Sort indicator should not be visible (no ◆ character)
    expect(screen.queryByText('◆')).not.toBeInTheDocument();
    // No visible active-sort styling via data attribute
    const sizeButton = screen.getByRole('button', { name: 'Size sorted descending' });
    expect(sizeButton).not.toHaveAttribute('data-active-sort');
    // But the button should still have accessible label indicating sort state
    expect(sizeButton).toBeInTheDocument();
  });

  it('exposes sort types from the table-view barrel', () => {
    const sortDirection: TableSortDirection = 'asc';
    const sortState: TableSortState<Row> = { columnKey: 'name', direction: sortDirection };

    expect(sortState.columnKey).toBe('name');
    expect(sortState.direction).toBe('asc');
  });
});
