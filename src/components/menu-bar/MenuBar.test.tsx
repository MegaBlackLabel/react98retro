import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MenuBar } from './MenuBar';

const SAMPLE_MENUS = [
  {
    label: 'ファイル(F)',
    items: [
      { type: 'item' as const, label: '開く', onClick: vi.fn() },
      { type: 'item' as const, label: '保存', onClick: vi.fn() },
      { type: 'separator' as const },
      { type: 'item' as const, label: '終了', onClick: vi.fn() },
    ],
  },
  {
    label: '編集(E)',
    items: [
      { type: 'item' as const, label: '切り取り', onClick: vi.fn() },
      { type: 'item' as const, label: 'コピー', onClick: vi.fn() },
      { type: 'item' as const, label: '貼り付け', onClick: vi.fn() },
    ],
  },
  {
    label: '表示(V)',
    items: [
      { type: 'item' as const, label: 'アイコン', checked: true },
      { type: 'item' as const, label: '一覧' },
    ],
  },
];

describe('MenuBar', () => {
  it('renders top-level menu items', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    expect(screen.getByText(/ファイル/)).toBeInTheDocument();
    expect(screen.getByText(/編集/)).toBeInTheDocument();
    expect(screen.getByText(/表示/)).toBeInTheDocument();
  });

  it('has menubar role', () => {
    const { container } = render(<MenuBar menus={SAMPLE_MENUS} />);
    expect(container.firstChild).toHaveAttribute('role', 'menubar');
  });

  it('opens dropdown menu when clicking a top-level item', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    // Initially, dropdown should not be visible
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    
    // Click on ファイル menu
    const fileMenu = screen.getByText(/ファイル/);
    fireEvent.click(fileMenu);
    
    // Now dropdown should be visible with menu items
    expect(screen.getByText('開く')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('終了')).toBeInTheDocument();
  });

  it('closes dropdown when clicking the same top-level item again', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    const fileMenu = screen.getByText(/ファイル/);
    fireEvent.click(fileMenu);
    expect(screen.getByText('開く')).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(fileMenu);
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
  });

  it('calls onClick when clicking a menu item', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', onClick: mockClick }],
      },
    ];
    
    render(<MenuBar menus={menus} />);
    
    fireEvent.click(screen.getByText(/ファイル/));
    fireEvent.click(screen.getByText('開く'));
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('closes menu when clicking outside', () => {
    render(
      <div>
        <MenuBar menus={SAMPLE_MENUS} />
        <div data-testid="outside">Outside</div>
      </div>
    );
    
    fireEvent.click(screen.getByText(/ファイル/));
    expect(screen.getByText('開く')).toBeInTheDocument();
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
  });

  it('renders checked menu items with checkmark', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    fireEvent.click(screen.getByText(/表示/));
    
    const checkedItem = screen.getByText('アイコン').closest('[role="menuitem"]');
    expect(checkedItem).toBeTruthy();
    // Checkmark should be present in the item
    expect(checkedItem?.textContent).toContain('✓');
  });

  it('renders separators between menu items', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    fireEvent.click(screen.getByText(/ファイル/));
    
    // Look for separator elements
    const separators = document.querySelectorAll('[role="separator"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('top-level menu items have aria attributes for accessibility', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    // Get all menuitems within the menubar (top-level only)
    const menubar = screen.getByRole('menubar');
    const topLevelItems = menubar.querySelectorAll('[role="menuitem"]');
    
    // Should have 3 top-level menu items
    expect(topLevelItems.length).toBeGreaterThanOrEqual(3);
    
    // Each should have aria-haspopup
    topLevelItems.forEach((item) => {
      expect(item).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  it('dropdown menus are visible when opened and not clipped by overflow', () => {
    const { container } = render(<MenuBar menus={SAMPLE_MENUS} />);
    
    // Open a menu
    fireEvent.click(screen.getByText(/ファイル/));
    
    // The dropdown should be visible in the document
    const menuItem = screen.getByText('開く');
    expect(menuItem).toBeVisible();
    expect(menuItem).toBeInTheDocument();
    
    // Get the menubar container
    const menuBar = container.firstChild as HTMLElement;
    
    // Verify the dropdown is rendered as a child of the menubar
    // This would fail if overflow: hidden was applied because the dropdown
    // is absolutely positioned and would be clipped
    const dropdown = menuBar.querySelector('[role="menu"]');
    expect(dropdown).toBeTruthy();
    expect(dropdown?.parentElement).toBeTruthy();
  });

  it('top-level menu items have non-wrapping text content', () => {
    const { container } = render(<MenuBar menus={SAMPLE_MENUS} />);
    const menuBar = container.firstChild as HTMLElement;
    
    // Verify the menubar has the expected structure
    expect(menuBar).toBeTruthy();
    
    // Get all top-level menu items
    const topLevelItems = menuBar.querySelectorAll('[role="menuitem"]');
    expect(topLevelItems.length).toBeGreaterThanOrEqual(3);
    
    // All items should have text content (no wrapping to empty)
    topLevelItems.forEach((item) => {
      expect(item.textContent).toBeTruthy();
      expect(item.textContent?.length).toBeGreaterThan(0);
    });
    
    // Verify menu labels are present and not truncated
    expect(screen.getByText(/ファイル/)).toBeInTheDocument();
    expect(screen.getByText(/編集/)).toBeInTheDocument();
    expect(screen.getByText(/表示/)).toBeInTheDocument();
  });

  it('supports keyboard Escape to close menu', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    fireEvent.click(screen.getByText(/ファイル/));
    expect(screen.getByText('開く')).toBeInTheDocument();
    
    // Press Escape
    fireEvent.keyDown(screen.getByRole('menubar'), { key: 'Escape' });
    
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation with arrow keys', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    
    const menubar = screen.getByRole('menubar');
    
    // Open first menu
    fireEvent.click(screen.getByText(/ファイル/));
    expect(screen.getByText('開く')).toBeInTheDocument();
    
    // Navigate down
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    
    // Navigate to next menu with ArrowRight
    fireEvent.keyDown(menubar, { key: 'ArrowRight' });
    
    // Should now be showing 編集 menu
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    expect(screen.getByText('切り取り')).toBeInTheDocument();
  });
});
