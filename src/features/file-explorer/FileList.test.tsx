import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileList } from './FileList';
import type { FSNode } from './useFileSystem';

function visibleNames() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelectorAll('td')[0]?.textContent?.trim() ?? '');
}

describe('FileList', () => {
  const items: FSNode[] = [
    {
      id: 'drive-c',
      name: 'ローカルディスク (C:)',
      type: 'drive',
      children: [],
    },
    {
      id: 'folder-z',
      name: 'Zeta Folder',
      type: 'folder',
      children: [],
      modified: new Date('2000-01-02T00:00:00'),
    },
    {
      id: 'folder-a',
      name: 'Alpha Folder',
      type: 'folder',
      children: [],
      modified: new Date('2000-01-03T00:00:00'),
    },
    {
      id: 'file-small',
      name: 'small.txt',
      type: 'file',
      size: 1024,
      modified: new Date('2000-01-02T00:00:00'),
    },
    {
      id: 'file-large',
      name: 'large.txt',
      type: 'file',
      size: 20480,
      modified: new Date('2000-01-01T00:00:00'),
    },
    {
      id: 'file-newest',
      name: 'newest.txt',
      type: 'file',
      size: 512,
      modified: new Date('2000-01-04T00:00:00'),
    },
  ];

  it('sorts rows by clicked column and keeps drives and folders before files', async () => {
    const user = userEvent.setup();

    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'サイズ' }));

    expect(visibleNames()).toEqual([
      'ローカルディスク (C:)',
      'Alpha Folder',
      'Zeta Folder',
      'newest.txt',
      'small.txt',
      'large.txt',
    ]);
  });

  it('toggles sort direction on the same column and uses raw modified dates', async () => {
    const user = userEvent.setup();

    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const modifiedHeader = screen.getByRole('button', { name: '更新日時' });

    await user.click(modifiedHeader);
    await user.click(modifiedHeader);

    expect(visibleNames()).toEqual([
      'ローカルディスク (C:)',
      'Alpha Folder',
      'Zeta Folder',
      'newest.txt',
      'small.txt',
      'large.txt',
    ]);
    expect(screen.getByRole('button', { name: '更新日時 sorted descending' })).toBeInTheDocument();
  });
});

// View mode tests
describe('FileList view modes', () => {
  const items: FSNode[] = [
    {
      id: 'folder-a',
      name: 'Alpha Folder',
      type: 'folder',
      children: [],
      modified: new Date('2000-01-03T00:00:00'),
    },
    {
      id: 'file-small',
      name: 'small.txt',
      type: 'file',
      size: 1024,
      modified: new Date('2000-01-02T00:00:00'),
    },
  ];

  it('renders details view (table) by default', () => {
    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '名前' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'サイズ' })).toBeInTheDocument();
  });

  it('renders large icons view', () => {
    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="largeIcons"
      />,
    );

    // Should not have table in large icons view
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    
    // Should show items as tiles
    expect(screen.getByText('Alpha Folder')).toBeInTheDocument();
    expect(screen.getByText('small.txt')).toBeInTheDocument();
  });

  it('renders small icons view', () => {
    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="smallIcons"
      />,
    );

    // Should not have table in small icons view
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    
    // Should show items
    expect(screen.getByText('Alpha Folder')).toBeInTheDocument();
    expect(screen.getByText('small.txt')).toBeInTheDocument();
  });

  it('renders list view', () => {
    render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="list"
      />,
    );

    // Should not have table headers in list view (no sorting)
    expect(screen.queryByRole('button', { name: 'サイズ' })).not.toBeInTheDocument();
    
    // Should show items as a single-column list
    expect(screen.getByText('Alpha Folder')).toBeInTheDocument();
    expect(screen.getByText('small.txt')).toBeInTheDocument();
  });

  it('handles selection in all view modes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
        onNavigate={vi.fn()}
        viewMode="largeIcons"
      />,
    );

    // Click on an item in large icons view
    await user.click(screen.getByText('Alpha Folder'));
    expect(onSelectionChange).toHaveBeenCalledWith(['folder-a']);

    // Switch to list view and test selection
    rerender(
      <FileList
        items={items}
        selectedIds={['file-small']}
        onSelectionChange={onSelectionChange}
        onNavigate={vi.fn()}
        viewMode="list"
      />,
    );

    await user.click(screen.getByText('small.txt'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['file-small']);
  });

  it('handles double-click navigation in all view modes', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    const { rerender } = render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={onNavigate}
        viewMode="largeIcons"
      />,
    );

    // Double-click folder in large icons view
    await user.dblClick(screen.getByText('Alpha Folder'));
    expect(onNavigate).toHaveBeenCalledWith('folder-a');

    // Switch to small icons view
    rerender(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={onNavigate}
        viewMode="smallIcons"
      />,
    );

    await user.dblClick(screen.getByText('Alpha Folder'));
    expect(onNavigate).toHaveBeenCalledWith('folder-a');
  });

  it('keeps the same ordered items when switching from sorted details to list and icon views', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="details"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'サイズ' }));

    expect(visibleNames()).toEqual(['Alpha Folder', 'small.txt']);

    rerender(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="list"
      />,
    );

    expect(screen.getAllByRole('listitem').map((item) => item.textContent?.trim())).toEqual([
      'Alpha Folder',
      'small.txt',
    ]);

    rerender(
      <FileList
        items={items}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onNavigate={vi.fn()}
        viewMode="largeIcons"
      />,
    );

    expect(screen.getAllByRole('listitem').map((item) => item.textContent?.trim())).toEqual([
      'Alpha Folder',
      'small.txt',
    ]);
  });
});
