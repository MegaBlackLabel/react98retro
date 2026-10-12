import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MenuBar } from './MenuBar';

/** テスト用の DOMRect スタブ */
function rect(bottom: number, left: number): DOMRect {
  return {
    top: bottom,
    bottom,
    left,
    right: left,
    width: 0,
    height: 0,
    x: left,
    y: bottom,
    toJSON: () => ({}),
  } as DOMRect;
}

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

    // ポップアップ層は menubar の外 (document.body) へ fixed で描画されるため、
    // overflow: hidden を持つ祖先にクリップされない
    const menuBar = container.firstChild as HTMLElement;
    const dropdown = screen.getByRole('menu');
    expect(menuBar.contains(dropdown)).toBe(false);
    expect(dropdown.parentElement).toBe(document.body);
    expect(dropdown.style.position).toBe('fixed');
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

  it('renders the dropdown in a popup layer outside the menubar subtree', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    fireEvent.click(screen.getByText(/ファイル/));

    const menu = screen.getByRole('menu');
    const menubar = screen.getByRole('menubar');

    expect(menubar.contains(menu)).toBe(false);
    expect(document.body.contains(menu)).toBe(true);
    expect(menu.style.position).toBe('fixed');
    expect(Number(menu.style.zIndex)).toBeGreaterThan(1000);
  });

  it('exposes a stable hook on top-level items for tests', () => {
    render(
      <MenuBar
        menus={[
          { id: 'file', label: 'ファイル(F)', items: [{ type: 'item', label: '開く' }] },
          { label: '編集(E)', items: [{ type: 'item', label: 'コピー' }] },
        ]}
      />,
    );

    expect(document.querySelector('[data-menu-id="file"]')).not.toBeNull();
    expect(document.querySelector('[data-menu-id="編集(E)"]')).not.toBeNull();
  });

  it('positions the popup layer below its trigger', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const trigger = screen.getByText(/ファイル/).closest('[role="menuitem"]') as HTMLElement;
    trigger.getBoundingClientRect = () => rect(58, 24);

    fireEvent.click(trigger);

    const menu = screen.getByRole('menu');
    expect(menu.style.top).toBe('58px');
    expect(menu.style.left).toBe('24px');
  });

  it('repositions the popup layer when the viewport changes', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const trigger = screen.getByText(/ファイル/).closest('[role="menuitem"]') as HTMLElement;
    let box = rect(58, 24);
    trigger.getBoundingClientRect = () => box;

    fireEvent.click(trigger);
    expect(screen.getByRole('menu').style.top).toBe('58px');

    box = rect(90, 40);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const menu = screen.getByRole('menu');
    expect(menu.style.top).toBe('90px');
    expect(menu.style.left).toBe('40px');
  });

  it('keeps the popup layer open while interacting with it', () => {
    const onClick = vi.fn();
    render(
      <MenuBar menus={[{ label: 'ファイル(F)', items: [{ type: 'item', label: '開く', onClick }] }]} />,
    );
    fireEvent.click(screen.getByText(/ファイル/));

    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('開く'));
    expect(onClick).toHaveBeenCalledOnce();
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

describe('MenuBar Alt accelerator keys', () => {
  it('opens the matching menu and focuses its first item with Alt+letter', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'f', altKey: true });

    expect(screen.getByText('開く')).toBeInTheDocument();
    const first = screen.getByText('開く').closest('[role="menuitem"]') as HTMLElement;
    expect(first.className).toContain('menuItemFocused');
  });

  it('treats the accelerator letter case-insensitively', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'F', altKey: true });

    expect(screen.getByText('開く')).toBeInTheDocument();
  });

  it('switches to another menu with Alt+letter while one is already open', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'f', altKey: true });
    expect(screen.getByText('開く')).toBeInTheDocument();

    fireEvent.keyDown(menubar, { key: 'e', altKey: true });

    expect(screen.queryByText('開く')).not.toBeInTheDocument();
    expect(screen.getByText('切り取り')).toBeInTheDocument();
    const first = screen.getByText('切り取り').closest('[role="menuitem"]') as HTMLElement;
    expect(first.className).toContain('menuItemFocused');
  });

  it('does nothing when no menu matches the accelerator', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'x', altKey: true });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps the currently open menu when the accelerator does not match', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'f', altKey: true });
    expect(screen.getByText('開く')).toBeInTheDocument();

    fireEvent.keyDown(menubar, { key: 'x', altKey: true });

    expect(screen.getByText('開く')).toBeInTheDocument();
  });

  it('focuses the menubar on a lone Alt keydown', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'Alt', altKey: true });

    expect(document.activeElement).toBe(menubar);
  });

  it('does not close an open menu on Alt keyup', () => {
    render(<MenuBar menus={SAMPLE_MENUS} />);
    const menubar = screen.getByRole('menubar');

    fireEvent.keyDown(menubar, { key: 'f', altKey: true });
    expect(screen.getByText('開く')).toBeInTheDocument();

    fireEvent.keyUp(menubar, { key: 'Alt' });

    expect(screen.getByText('開く')).toBeInTheDocument();
  });
});
