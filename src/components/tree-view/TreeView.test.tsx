import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TreeView } from './TreeView';

describe('TreeView', () => {
  it('renders all top-level items', () => {
    render(
      <TreeView
        items={[
          { id: 'file-1', label: 'File 1' },
          {
            id: 'folder',
            label: 'Folder',
            children: [{ id: 'child', label: 'Child' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('File 1')).toBeInTheDocument();
    expect(screen.getByText('Folder')).toBeInTheDocument();
  });

  it('items with children render as details/summary', () => {
    render(
      <TreeView
        items={[
          {
            id: 'folder',
            label: 'Folder',
            children: [{ id: 'child', label: 'Child' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Folder').closest('summary')).toBeInTheDocument();
    expect(screen.getByText('Child').closest('li')).toBeInTheDocument();
  });

  it('clicking an item calls onSelect with correct id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<TreeView items={[{ id: 'file-1', label: 'File 1' }]} onSelect={onSelect} />);

    await user.click(screen.getByText('File 1'));

    expect(onSelect).toHaveBeenCalledWith('file-1');
  });

  it('selected item has highlighted background', () => {
    render(
      <TreeView
        items={[{ id: 'file-1', label: 'File 1' }]}
        selectedId="file-1"
      />,
    );

    // Selection is applied to the inner span, not the li itself
    const span = screen.getByText('File 1').closest('span');
    expect(span).toHaveStyle({
      background: '#000080',
      color: 'rgb(255, 255, 255)',
    });
  });

  it('defaultOpen sets <details open> on expandable items', () => {
    render(
      <TreeView
        items={[
          {
            id: 'folder',
            label: 'Folder',
            defaultOpen: true,
            children: [{ id: 'child', label: 'Child' }],
          },
        ]}
      />,
    );

    const details = screen.getByText('Folder').closest('details');
    expect(details).toHaveAttribute('open');
  });

  it('three-level nested tree renders all items', () => {
    render(
      <TreeView
        items={[
          {
            id: 'level1',
            label: 'Level 1',
            defaultOpen: true,
            children: [
              {
                id: 'level2',
                label: 'Level 2',
                defaultOpen: true,
                children: [{ id: 'level3', label: 'Level 3' }],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('pressing Enter on a focused leaf triggers onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TreeView items={[{ id: 'file-1', label: 'File 1' }]} onSelect={onSelect} />);

    const leaf = screen.getByText('File 1').closest('li')!;
    leaf.focus();

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('file-1');
  });

  it('pressing Space on a focused leaf triggers onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TreeView items={[{ id: 'file-1', label: 'File 1' }]} onSelect={onSelect} />);

    const leaf = screen.getByText('File 1').closest('li')!;
    leaf.focus();

    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledWith('file-1');
  });
});
