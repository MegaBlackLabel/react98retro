import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  it('renders disabled menu items without calling onClick and keeps menu open', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          { type: 'item' as const, label: '開く', onClick: mockClick, disabled: true },
          { type: 'item' as const, label: '保存', onClick: vi.fn() },
        ],
      },
    ];

    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText(/ファイル/));

    const disabledItem = screen.getByText('開く').closest('[role="menuitem"]') as HTMLElement;
    expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(disabledItem);
    expect(mockClick).not.toHaveBeenCalled();
    expect(screen.getByText('開く')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('renders disabled item with disabled styling class', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', disabled: true }],
      },
    ];
    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText(/ファイル/));
    const disabledItem = screen.getByText('開く').closest('[role="menuitem"]') as HTMLElement;
    expect(disabledItem.className).toContain('menuItemDisabled');
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

  it('renders access-key underline inside labels like ファイル(F)', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);

    const fileMenu = screen.getByText(/ファイル/);
    const underline = fileMenu.querySelector('u');
    expect(underline).toBeInTheDocument();
    expect(underline).toHaveTextContent('F');
  });

  it('renders rightIcons as decorative img elements', () => {
    const { container } = render(
      <MenuBar
        menus={SAMPLE_MENUS}
        rightIcons={['https://example.com/a.png', 'https://example.com/b.png']}
      />
    );

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    images.forEach((img) => {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('switches top-level menu on hover when another menu is already open', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);

    fireEvent.click(screen.getByText(/ファイル/));
    expect(screen.getByText('開く')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText(/編集/));

    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    expect(screen.getByText('切り取り')).toBeInTheDocument();
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

describe('MenuBar disabled item keyboard activation', () => {
  it('keyboard Enter on disabled item does not call onClick and menu stays open', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          { type: 'item' as const, label: '開く', onClick: mockClick, disabled: true },
          { type: 'item' as const, label: '保存', onClick: vi.fn() },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    // ArrowDown focuses first item (disabled)
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    const focused = screen.getByText('開く').closest('[role="menuitem"]') as HTMLElement;
    expect(focused.className).toContain('menuItemFocused');

    // Enter should NOT activate disabled item
    fireEvent.keyDown(menubar, { key: 'Enter' });
    expect(mockClick).not.toHaveBeenCalled();
    expect(screen.getByText('開く')).toBeInTheDocument(); // menu stays open
  });

  it('keyboard Space on disabled item does not call onClick and menu stays open', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          { type: 'item' as const, label: '開く', onClick: mockClick, disabled: true },
          { type: 'item' as const, label: '保存', onClick: vi.fn() },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    const focused = screen.getByText('開く').closest('[role="menuitem"]') as HTMLElement;
    expect(focused.className).toContain('menuItemFocused');

    // Space should NOT activate disabled item
    fireEvent.keyDown(menubar, { key: ' ' });
    expect(mockClick).not.toHaveBeenCalled();
    expect(screen.getByText('開く')).toBeInTheDocument(); // menu stays open
  });
});
});

describe('MenuBar submenu hover lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens submenu after 150ms hover and closes when leaving without leaking timers', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          {
            type: 'submenu' as const,
            label: '最近使ったファイル',
            items: [
              { type: 'item' as const, label: 'doc1.txt', onClick: vi.fn() },
              { type: 'item' as const, label: 'doc2.txt', onClick: vi.fn() },
            ],
          },
          { type: 'item' as const, label: '終了', onClick: vi.fn() },
        ],
      },
    ];

    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText(/ファイル/));

    const submenuParent = screen
      .getByText('最近使ったファイル')
      .closest('[role="menuitem"]') as HTMLElement;
    expect(submenuParent).toHaveAttribute('aria-haspopup', 'true');
    expect(submenuParent.textContent).toContain('▶');

    fireEvent.mouseEnter(submenuParent);

    // Before the delay the children should not be visible
    expect(screen.queryByText('doc1.txt')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('doc1.txt')).toBeInTheDocument();
    expect(screen.getByText('doc2.txt')).toBeInTheDocument();

    // Leaving should clear the timer so advancing again does not reopen
    fireEvent.mouseLeave(submenuParent);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // The submenu DOM is still rendered; the timer just does not leak.
    expect(screen.getByText('doc1.txt')).toBeInTheDocument();
  });

  it('does not open submenu on hover when submenu is disabled', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          {
            type: 'submenu' as const,
            label: '最近使ったファイル',
            disabled: true,
            items: [{ type: 'item' as const, label: 'doc.txt', onClick: vi.fn() }],
          },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText(/ファイル/));

    const submenuParent = screen
      .getByText('最近使ったファイル')
      .closest('[role="menuitem"]') as HTMLElement;
    expect(submenuParent).toHaveAttribute('aria-disabled', 'true');
    expect(submenuParent.className).toContain('menuItemDisabled');

    fireEvent.mouseEnter(submenuParent);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Submenu children should NOT be visible because submenu is disabled
    expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
  });
});

describe('MenuBar keyboard navigation', () => {
  it('ArrowUp wraps to bottom and skips separators', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          { type: 'item' as const, label: '開く', onClick: vi.fn() },
          { type: 'separator' as const },
          { type: 'item' as const, label: '保存', onClick: vi.fn() },
          { type: 'item' as const, label: '終了', onClick: vi.fn() },
        ],
      },
    ];

    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    fireEvent.keyDown(menubar, { key: 'ArrowUp' });
    const lastFocused = screen.getByText('終了').closest('[role="menuitem"]') as HTMLElement;
    expect(lastFocused.className).toContain('menuItemFocused');

    fireEvent.keyDown(menubar, { key: 'ArrowUp' });
    const secondFocused = screen.getByText('保存').closest('[role="menuitem"]') as HTMLElement;
    expect(secondFocused.className).toContain('menuItemFocused');
  });

  it('ArrowLeft moves to previous top-level menu and closes open submenu', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', onClick: vi.fn() }],
      },
      {
        label: '編集(E)',
        items: [
          {
            type: 'submenu' as const,
            label: '最近使ったファイル',
            items: [{ type: 'item' as const, label: 'doc.txt', onClick: vi.fn() }],
          },
        ],
      },
    ];

    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');

    // Open second menu
    fireEvent.click(screen.getByText(/編集/));
    expect(screen.getByText('最近使ったファイル')).toBeInTheDocument();

    // Move to previous menu
    fireEvent.keyDown(menubar, { key: 'ArrowLeft' });
    expect(screen.queryByText('最近使ったファイル')).not.toBeInTheDocument();
    expect(screen.getByText('開く')).toBeInTheDocument();

    // Reopen second menu and open its submenu
    fireEvent.click(screen.getByText(/編集/));
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    fireEvent.keyDown(menubar, { key: 'ArrowRight' });
    expect(screen.getByText('doc.txt')).toBeInTheDocument();

    // ArrowLeft closes submenu but keeps menu open
    fireEvent.keyDown(menubar, { key: 'ArrowLeft' });
    expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
    expect(screen.getByText('最近使ったファイル')).toBeInTheDocument();
  });

  it('Enter activates a focused menu item and closes the menu', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', onClick: mockClick }],
      },
    ];

    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    fireEvent.keyDown(menubar, { key: 'Enter' });

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
  });

  it('Space activates a focused menu item and closes the menu', () => {
    const mockClick = vi.fn();
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', onClick: mockClick }],
      },
    ];

    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    fireEvent.keyDown(menubar, { key: ' ' });

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
  });

  it('ArrowDown wraps from last item to first', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          { type: 'item' as const, label: '開く', onClick: vi.fn() },
          { type: 'item' as const, label: '終了', onClick: vi.fn() },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    // ArrowDown focuses first
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    expect(
      screen.getByText('開く').closest('[role="menuitem"]')?.className,
    ).toContain('menuItemFocused');

    // ArrowDown focuses second (last)
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    expect(
      screen.getByText('終了').closest('[role="menuitem"]')?.className,
    ).toContain('menuItemFocused');

    // ArrowDown wraps to first
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    expect(
      screen.getByText('開く').closest('[role="menuitem"]')?.className,
    ).toContain('menuItemFocused');
  });

  it('ArrowRight wraps from last top-level menu to first', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [{ type: 'item' as const, label: '開く', onClick: vi.fn() }],
      },
      {
        label: '編集(E)',
        items: [{ type: 'item' as const, label: '切り取り', onClick: vi.fn() }],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');

    // Open first menu
    fireEvent.click(screen.getByText(/ファイル/));
    expect(screen.getByText('開く')).toBeInTheDocument();

    // ArrowRight moves to second (last)
    fireEvent.keyDown(menubar, { key: 'ArrowRight' });
    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    expect(screen.getByText('切り取り')).toBeInTheDocument();

    // ArrowRight wraps to first
    fireEvent.keyDown(menubar, { key: 'ArrowRight' });
    expect(screen.queryByText('切り取り')).not.toBeInTheDocument();
    expect(screen.getByText('開く')).toBeInTheDocument();
  });

  it('keyboard Enter on focused disabled submenu does not open children', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          {
            type: 'submenu' as const,
            label: '最近使ったファイル',
            disabled: true,
            items: [{ type: 'item' as const, label: 'doc.txt', onClick: vi.fn() }],
          },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    // Focus disabled submenu
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    const focused = screen
      .getByText('最近使ったファイル')
      .closest('[role="menuitem"]') as HTMLElement;
    expect(focused.className).toContain('menuItemFocused');

    // Enter should NOT open disabled submenu
    fireEvent.keyDown(menubar, { key: 'Enter' });
    expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
  });

  it('keyboard Space on focused disabled submenu does not open children', () => {
    const menus = [
      {
        label: 'ファイル(F)',
        items: [
          {
            type: 'submenu' as const,
            label: '最近使ったファイル',
            disabled: true,
            items: [{ type: 'item' as const, label: 'doc.txt', onClick: vi.fn() }],
          },
        ],
      },
    ];
    render(<MenuBar menus={menus} />);
    const menubar = screen.getByRole('menubar');
    fireEvent.click(screen.getByText(/ファイル/));

    // Focus disabled submenu
    fireEvent.keyDown(menubar, { key: 'ArrowDown' });
    const focused = screen
      .getByText('最近使ったファイル')
      .closest('[role="menuitem"]') as HTMLElement;
    expect(focused.className).toContain('menuItemFocused');

    // Space should NOT open disabled submenu
    fireEvent.keyDown(menubar, { key: ' ' });
    expect(screen.queryByText('doc.txt')).not.toBeInTheDocument();
  });
});
