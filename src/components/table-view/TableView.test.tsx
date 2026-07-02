import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { TableView } from './TableView';
import type { TableColumn, TableSortDirection, TableSortState } from './index';
import styles from './TableView.module.css';

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

  describe('multi-select with modifier keys', () => {
    it('Ctrl+click toggles an unselected row into selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <TableView columns={columns} rows={rows} selectedIds={['1']} onSelectionChange={onSelectionChange} />,
      );

      await user.keyboard('{Control>}');
      await user.click(screen.getByText('other.txt'));
      await user.keyboard('{/Control}');

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('Ctrl+click toggles a selected row out of selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <TableView columns={columns} rows={rows} selectedIds={['1', '2']} onSelectionChange={onSelectionChange} />,
      );

      await user.keyboard('{Control>}');
      await user.click(screen.getByText('file.txt'));
      await user.keyboard('{/Control}');

      expect(onSelectionChange).toHaveBeenCalledWith(['2']);
    });

    it('Meta+click toggles an unselected row into selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <TableView columns={columns} rows={rows} selectedIds={['1']} onSelectionChange={onSelectionChange} />,
      );

      await user.keyboard('{Meta>}');
      await user.click(screen.getByText('other.txt'));
      await user.keyboard('{/Meta}');

      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('controlled selection', () => {
    it('calls onSelectionChange on click but does not visually change until selectedIds prop updates', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <TableView columns={columns} rows={rows} selectedIds={['1']} onSelectionChange={onSelectionChange} />,
      );

      // Initially row 1 is highlighted, row 2 is not
      expect(screen.getByText('file.txt').closest('tr')).toHaveClass('highlighted');
      expect(screen.getByText('other.txt').closest('tr')).not.toHaveClass('highlighted');

      // Click row 2
      await user.click(screen.getByText('other.txt'));

      // onSelectionChange is called with the new selection
      expect(onSelectionChange).toHaveBeenCalledWith(['2']);

      // But visually nothing changes — selectedIds prop is still ['1']
      expect(screen.getByText('other.txt').closest('tr')).not.toHaveClass('highlighted');
      expect(screen.getByText('file.txt').closest('tr')).toHaveClass('highlighted');

      // Now the parent updates the selectedIds prop
      rerender(
        <TableView columns={columns} rows={rows} selectedIds={['2']} onSelectionChange={onSelectionChange} />,
      );

      // Now row 2 should be highlighted
      expect(screen.getByText('other.txt').closest('tr')).toHaveClass('highlighted');
      expect(screen.getByText('file.txt').closest('tr')).not.toHaveClass('highlighted');
    });
  });

  describe('uncontrolled selection', () => {
    it('manages selection internally when no selectedIds or onSelectionChange props', async () => {
      const user = userEvent.setup();
      render(<TableView columns={columns} rows={rows} />);

      await user.click(screen.getByText('file.txt'));
      expect(screen.getByText('file.txt').closest('tr')).toHaveClass('highlighted');

      await user.click(screen.getByText('other.txt'));
      expect(screen.getByText('file.txt').closest('tr')).not.toHaveClass('highlighted');
      expect(screen.getByText('other.txt').closest('tr')).toHaveClass('highlighted');
    });
  });

  describe('column resize', () => {
    afterEach(() => {
      // Clean up any lingering document listeners
      vi.restoreAllMocks();
    });

    it('resize handle mousedown + mousemove changes column width, mouseup stops further changes', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);

      // Find the first column header's resize handle (last child div in th)
      const firstTh = container.querySelector('th');
      const resizeHandle = firstTh?.querySelector(`.${styles.resizeHandle}`);
      expect(resizeHandle).toBeTruthy();

      // Initial width should be 100 (default)
      expect(firstTh).toHaveStyle({ width: '100px' });

      // Start resize: mousedown at clientX=100
      fireEvent.mouseDown(resizeHandle!, { clientX: 100 });

      // Drag: mousemove to clientX=150 (delta=50, newWidth=150)
      act(() => {
        fireEvent.mouseMove(document, { clientX: 150 });
      });

      // Width should have increased
      expect(firstTh).toHaveStyle({ width: '150px' });

      // End resize: mouseup
      fireEvent.mouseUp(document);

      // Further mousemove should NOT change width
      act(() => {
        fireEvent.mouseMove(document, { clientX: 200 });
      });
      expect(firstTh).toHaveStyle({ width: '150px' });
    });

    it('clamps column width to minimum 30px', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);

      const firstTh = container.querySelector('th');
      const resizeHandle = firstTh?.querySelector(`.${styles.resizeHandle}`);
      expect(resizeHandle).toBeTruthy();

      // Start at 100, move far left
      fireEvent.mouseDown(resizeHandle!, { clientX: 100 });
      act(() => {
        fireEvent.mouseMove(document, { clientX: 10 });
      });

      // Should clamp to minimum 30, not go negative
      expect(firstTh).toHaveStyle({ width: '30px' });

      fireEvent.mouseUp(document);
    });
  });

  describe('empty rows', () => {
    it('renders no tbody data rows when rows array is empty', () => {
      render(<TableView columns={columns} rows={[]} />);

      // Headers should still render
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();

      // No tr elements in tbody
      const tbody = document.querySelector('tbody');
      expect(tbody?.querySelectorAll('tr')).toHaveLength(0);
    });

    it('does not crash with empty rows', () => {
      // Should render without throwing
      const { container } = render(<TableView columns={columns} rows={[]} />);
      expect(container.querySelector('table')).toBeTruthy();
    });
  });

  describe('custom cell render', () => {
    it('renders custom cell content via render prop', () => {
      const customColumns: TableColumn<Row>[] = [
        { key: 'name', header: 'Name', render: (value) => <strong>Custom: {String(value)}</strong> },
        { key: 'size', header: 'Size' },
      ];
      render(<TableView columns={customColumns} rows={rows} />);

      // Custom rendered content should appear
      expect(screen.getByText('Custom: file.txt')).toBeInTheDocument();
      // Default rendering for column without render prop
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });

    it('render prop receives row object as second argument', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- verify row is passed as second arg
      const renderSpy = vi.fn((value: unknown, _row: Row) => String(value));
      const customColumns: TableColumn<Row>[] = [
        { key: 'name', header: 'Name', render: renderSpy },
      ];
      render(<TableView columns={customColumns} rows={rows} />);

      expect(renderSpy).toHaveBeenCalledWith('file.txt', rows[0]);
    });
  });

  describe('sort direction toggle', () => {
    it('toggles from asc to desc when same sorted column header is clicked', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();

      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'name', direction: 'asc' }}
          onSortChange={onSortChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Name sorted ascending' }));

      expect(onSortChange).toHaveBeenCalledWith({ columnKey: 'name', direction: 'desc' });
    });

    it('switches to asc when clicking a different column from current sort', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();

      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'name', direction: 'desc' }}
          onSortChange={onSortChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Size' }));

      // Different column: always starts with asc
      expect(onSortChange).toHaveBeenCalledWith({ columnKey: 'size', direction: 'asc' });
    });
  });

  describe('interactive class', () => {
    it('applies interactive class to table element by default', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);
      expect(container.querySelector('table')).toHaveClass('interactive');
    });

    it('applies interactive class when interactive prop is true', () => {
      const { container } = render(<TableView columns={columns} rows={rows} interactive={true} />);
      expect(container.querySelector('table')).toHaveClass('interactive');
    });

    it('omits interactive class when interactive prop is false', () => {
      const { container } = render(<TableView columns={columns} rows={rows} interactive={false} />);
      expect(container.querySelector('table')).not.toHaveClass('interactive');
    });
  });

  describe('height and style', () => {
    it('applies height prop as CSS height on outer container', () => {
      const { container } = render(<TableView columns={columns} rows={rows} height={300} />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveStyle({ height: '300px', overflow: 'auto' });
    });

    it('defaults to height 200 when no height prop provided', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveStyle({ height: '200px' });
    });

    it('merges style prop with default height and overflow styles', () => {
      const { container } = render(
        <TableView columns={columns} rows={rows} style={{ border: '1px solid red' }} />,
      );
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveStyle({ height: '200px', overflow: 'auto' });
      // Shorthand border is split into longhands by CSSOM; verify border is applied
      expect(outerDiv.style.border).toBe('1px solid red');
    });

    it('style prop overrides default height when both provided', () => {
      const { container } = render(
        <TableView columns={columns} rows={rows} height={100} style={{ height: 400 }} />,
      );
      const outerDiv = container.firstChild as HTMLElement;
      // style spread after height means explicit style wins
      expect(outerDiv).toHaveStyle({ height: '400px' });
    });
  });

  describe('table structure', () => {
    it('renders sunken-panel class on outer wrapper', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);
      expect(container.firstChild).toHaveClass('sunken-panel');
    });

    it('renders table with fixed layout and full width', () => {
      const { container } = render(<TableView columns={columns} rows={rows} />);
      const table = container.querySelector('table');
      expect(table).toHaveStyle({ tableLayout: 'fixed', width: '100%' });
    });

    it('sets aria-sort on active sort column header', () => {
      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'name', direction: 'asc' }}
          onSortChange={vi.fn()}
        />,
      );

      // The <th> accessible name is the column header text, not the button aria-label
      const nameTh = screen.getByRole('columnheader', { name: 'Name' });
      expect(nameTh).toHaveAttribute('aria-sort', 'ascending');
    });

    it('sets aria-sort to descending on desc-sorted column', () => {
      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'size', direction: 'desc' }}
          onSortChange={vi.fn()}
        />,
      );

      const sizeTh = screen.getByRole('columnheader', { name: 'Size' });
      expect(sizeTh).toHaveAttribute('aria-sort', 'descending');
    });

    it('does not set aria-sort on unsorted columns', () => {
      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'name', direction: 'asc' }}
          onSortChange={vi.fn()}
        />,
      );

      const sizeTh = screen.getByRole('columnheader', { name: 'Size' });
      expect(sizeTh).not.toHaveAttribute('aria-sort');
    });
  });

  describe('header button accessibility', () => {
    it('header sort button has accessible label without direction when not active', () => {
      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: null, direction: 'asc' }}
          onSortChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    });

    it('header sort button label includes sort direction when active', () => {
      render(
        <TableView
          columns={columns}
          rows={rows}
          sort={{ columnKey: 'name', direction: 'desc' }}
          onSortChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Name sorted descending' })).toBeInTheDocument();
    });
  });
});
