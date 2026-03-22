import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MenuBar } from './MenuBar';
import type { MenuBarMenu } from './MenuBar';

const sampleMenus: MenuBarMenu[] = [
  {
    label: 'File',
    items: [
      { type: 'item', label: 'New', onClick: vi.fn() },
      { type: 'separator' },
      { type: 'item', label: 'Open', onClick: vi.fn() },
      { type: 'item', label: 'Disabled Item', disabled: true, onClick: vi.fn() },
    ],
  },
  {
    label: 'Edit',
    items: [
      { type: 'item', label: 'Cut', onClick: vi.fn() },
      { type: 'item', label: 'Copy', onClick: vi.fn() },
    ],
  },
];

describe('MenuBar', () => {
  it('renders all top-level menu labels', () => {
    render(<MenuBar menus={sampleMenus} />);
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('clicking a menu label opens its dropdown', () => {
    render(<MenuBar menus={sampleMenus} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('clicking a menu label again closes its dropdown', () => {
    render(<MenuBar menus={sampleMenus} />);
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('File'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking outside closes the dropdown', () => {
    render(<MenuBar menus={sampleMenus} />);
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking a menu item calls its onClick', () => {
    const onClick = vi.fn();
    const menus: MenuBarMenu[] = [
      { label: 'File', items: [{ type: 'item', label: 'New', onClick }] },
    ];
    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText('File'));
    fireEvent.click(screen.getByText('New'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disabled item does not call onClick', () => {
    const onClick = vi.fn();
    const menus: MenuBarMenu[] = [
      {
        label: 'File',
        items: [{ type: 'item', label: 'Disabled', disabled: true, onClick }],
      },
    ];
    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText('File'));
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Escape key closes the dropdown', () => {
    render(<MenuBar menus={sampleMenus} />);
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('menubar'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('separator renders correctly', () => {
    render(<MenuBar menus={sampleMenus} />);
    fireEvent.click(screen.getByText('File'));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
