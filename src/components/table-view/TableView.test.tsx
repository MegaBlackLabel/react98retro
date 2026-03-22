import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TableView } from './TableView';

type Row = {
  id: string;
  name: string;
  size: string;
  type: string;
  modified: string;
};

describe('TableView', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'size', header: 'Size' },
  ] as const;

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
});
