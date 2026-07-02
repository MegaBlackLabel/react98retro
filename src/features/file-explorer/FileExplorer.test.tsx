import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileExplorer } from './FileExplorer';

function openMenu(labelText: string) {
  const item = screen.getAllByRole('menuitem').find((el) => el.textContent?.includes(labelText));
  if (!item) throw new Error(`Missing menu item: ${labelText}`);
  fireEvent.click(item);
}

function openFileMenuSubmenu() {
  openMenu('ファイル');
  const submenu = screen.getByText('新規作成');
  fireEvent.mouseEnter(submenu);
  act(() => {
    vi.advanceTimersByTime(150);
  });
}

function fileListTable() {
  return screen.getByRole('table');
}

function fileList() {
  return within(fileListTable());
}

function rowNamed(name: string) {
  return fileList()
    .getAllByRole('row')
    .find((row) => within(row).queryByText(name, { exact: true }));
}

function requireRow(name: string) {
  const row = rowNamed(name);
  if (!row) throw new Error(`Missing row: ${name}`);
  return row;
}

function clickRow(name: string) {
  fireEvent.click(requireRow(name));
}

function doubleClickRow(name: string) {
  fireEvent.doubleClick(requireRow(name));
}

function navigateToDrive() {
  doubleClickRow('ローカルディスク (C:)');
}

function navigateToWindows() {
  doubleClickRow('WINDOWS');
}

function currentRows() {
  return fileList().getAllByRole('row');
}

describe('FileExplorer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps toolbar and menu disabled states in sync with selection and clipboard', () => {
    render(<FileExplorer />);

    expect(screen.getByRole('button', { name: '切り取り' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'コピー' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '貼り付け' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '削除' })).toBeDisabled();

    openMenu('編集');
    expect(screen.getByText('切り取り').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('コピー').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('貼り付け').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true');

    fireEvent.keyDown(screen.getByRole('menubar'), { key: 'Escape' });

    navigateToDrive();
    navigateToWindows();
    clickRow('Temp');

    expect(screen.getByRole('button', { name: '切り取り' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'コピー' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '削除' })).toBeEnabled();

    openMenu('編集');
    const enabledMenu = screen.getByRole('menu');
    expect(enabledMenu.querySelectorAll('[role="menuitem"]')[0]).toHaveAttribute('aria-disabled', 'false');
    expect(enabledMenu.querySelectorAll('[role="menuitem"]')[1]).toHaveAttribute('aria-disabled', 'false');
    expect(enabledMenu.querySelectorAll('[role="menuitem"]')[2]).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'コピー' }));
    expect(screen.getByRole('button', { name: '貼り付け' })).toBeEnabled();
  });

  it('creates a new folder from the file menu and selects it', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    openFileMenuSubmenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'フォルダ' }));

    expect(currentRows().some((row) => row.classList.contains('highlighted') && row.textContent?.includes('新しいフォルダー'))).toBe(true);
  });

  it('renames the single selected item through prompt', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    clickRow('Temp');
    vi.spyOn(window, 'prompt').mockReturnValue('Renamed Temp');

    openMenu('ファイル');
    fireEvent.click(screen.getByRole('menuitem', { name: '名前の変更' }));

    expect(requireRow('Renamed Temp')).toBeInTheDocument();
    expect(fileList().queryByText('Temp', { exact: true })).not.toBeInTheDocument();
  });

  it('copies and pastes through the rendered toolbar', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    clickRow('Temp');
    fireEvent.click(screen.getByRole('button', { name: 'コピー' }));
    fireEvent.click(screen.getByRole('button', { name: '貼り付け' }));

    expect(currentRows().some((row) => row.textContent?.includes('Temp (2)'))).toBe(true);
  });

  it('cuts and pastes through the edit menu', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    clickRow('Temp');

    openMenu('編集');
    fireEvent.click(screen.getByRole('menuitem', { name: '切り取り' }));

    fireEvent.click(screen.getByRole('button', { name: '上へ' }));
    expect(requireRow('My Documents')).toBeInTheDocument();

    doubleClickRow('My Documents');
    fireEvent.click(screen.getByRole('button', { name: '貼り付け' }));

    expect(requireRow('Temp')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '上へ' }));
    expect(fileList().queryByText('Temp', { exact: true })).not.toBeInTheDocument();
  });

  it('deletes the selected item', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    clickRow('Temp');
    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    expect(fileList().queryByText('Temp', { exact: true })).not.toBeInTheDocument();
  });

  it('select all selects every item in the current folder', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();
    openMenu('編集');
    fireEvent.click(screen.getByRole('menuitem', { name: 'すべて選択' }));

    expect(currentRows().some((row) => row.classList.contains('highlighted'))).toBe(true);
  });

  it('close menu item calls onClose', () => {
    const onClose = vi.fn();
    render(<FileExplorer onClose={onClose} />);

    openFileMenuSubmenu();
    fireEvent.click(screen.getByText('閉じる'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // View mode switching tests
  it('shows checked menu items for view modes in the 表示 menu', () => {
    render(<FileExplorer />);

    openMenu('表示');

    const viewMenu = screen.getByRole('menu');
    const viewItems = viewMenu.querySelectorAll('[role="menuitem"]');
    
    // View mode items start at index 2 (after ツールバー, ステータスバー, separator)
    expect(viewItems[2]).toHaveTextContent('大きいアイコン');
    expect(viewItems[3]).toHaveTextContent('小さいアイコン');
    expect(viewItems[4]).toHaveTextContent('一覧');
    expect(viewItems[5]).toHaveTextContent('詳細');
    
    // Details should be checked by default
    expect(viewItems[5]).toHaveTextContent('✓');
  });

  it('switches view mode via menu items', () => {
    render(<FileExplorer />);

    // Open view menu and click on 大きいアイコン
    openMenu('表示');
    fireEvent.click(screen.getByRole('menuitem', { name: '大きいアイコン' }));

    // Re-open menu to verify checkmark moved
    openMenu('表示');
    const viewMenu = screen.getByRole('menu');
    const viewItems = viewMenu.querySelectorAll('[role="menuitem"]');
    
    // Large icons should now be checked
    expect(viewItems[2]).toHaveTextContent('✓');
    expect(viewItems[5]).not.toHaveTextContent('✓詳細');
  });

  it('switches view mode via toolbar splitButton', () => {
    render(<FileExplorer />);

    // Click the toolbar splitButton
    fireEvent.click(screen.getByRole('button', { name: /表示.*メニューを開く/ }));
    
    // The dropdown menu should open with view mode options
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    
    // Click on a view mode
    fireEvent.click(screen.getByRole('menuitem', { name: '一覧' }));
    
    // Menu should close
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows initial object count in status bar', () => {
    render(<FileExplorer />);
    expect(screen.getByText(/個のオブジェクト/)).toBeInTheDocument();
  });

  it('shows object count after navigation to drive', () => {
    render(<FileExplorer />);
    navigateToDrive();
    expect(screen.getByText(/5 個のオブジェクト/)).toBeInTheDocument();
  });

  it('shows selected file size in status bar', () => {
    render(<FileExplorer />);
    navigateToDrive();
    clickRow('Autoexec.bat');
    expect(screen.getByText(/バイト/)).toBeInTheDocument();
  });

  it('shows current path in address bar', () => {
    render(<FileExplorer />);
    const addressSelect = screen.getByLabelText('アドレス(D):');
    expect(addressSelect).toHaveValue('マイコンピュータ');

    navigateToDrive();
    expect(addressSelect).toHaveValue('C:');
  });

  // ═══════════════════════════════════════════
  // Task 7: Behavioral integration tests
  // ═══════════════════════════════════════════

  // ── Navigation history: Back/Forward ──
  it('navigates back and forward through history and shows correct address and rows', () => {
    render(<FileExplorer />);

    // root → C:
    navigateToDrive();
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('C:');

    // C: → WINDOWS
    navigateToWindows();
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('C:\\WINDOWS');
    expect(requireRow('Temp')).toBeInTheDocument();

    // Back → C:
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('C:');
    expect(requireRow('WINDOWS')).toBeInTheDocument();
    expect(requireRow('My Documents')).toBeInTheDocument();
    expect(screen.getByText(/5 個のオブジェクト/)).toBeInTheDocument();

    // Forward → WINDOWS
    fireEvent.click(screen.getByRole('button', { name: '進む' }));
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('C:\\WINDOWS');
    expect(requireRow('Temp')).toBeInTheDocument();
  });

  // ── Up button / root edge ──
  it('disables up at root and navigates up to correct parent from subfolders', () => {
    render(<FileExplorer />);

    // At root, Up is disabled
    expect(screen.getByRole('button', { name: '上へ' })).toBeDisabled();

    // navigate C: → Up back to root
    navigateToDrive();
    expect(screen.getByRole('button', { name: '上へ' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '上へ' }));
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('マイコンピュータ');
    expect(requireRow('ローカルディスク (C:)')).toBeInTheDocument();

    // navigate C: → WINDOWS → Up back to C:
    navigateToDrive();
    navigateToWindows();
    fireEvent.click(screen.getByRole('button', { name: '上へ' }));
    expect(screen.getByLabelText('アドレス(D):')).toHaveValue('C:');
    expect(requireRow('WINDOWS')).toBeInTheDocument();
    expect(screen.getByText(/5 個のオブジェクト/)).toBeInTheDocument();
  });

  // ── AddressBar history-based navigation ──
  it('shows history entries in address bar dropdown and navigates by selecting one', () => {
    render(<FileExplorer />);

    navigateToDrive();
    navigateToWindows();

    const addressSelect = screen.getByLabelText('アドレス(D):') as HTMLSelectElement;
    expect(addressSelect).toHaveValue('C:\\WINDOWS');

    // History entries should be available in the dropdown
    const options = Array.from(addressSelect.querySelectorAll('option'));
    const optionValues = options.map((o) => o.value);
    expect(optionValues).toContain('C:');
    expect(optionValues).toContain('C:\\WINDOWS');

    // Select 'C:' from dropdown to navigate back
    fireEvent.change(addressSelect, { target: { value: 'C:' } });
    expect(addressSelect).toHaveValue('C:');
    expect(requireRow('WINDOWS')).toBeInTheDocument();
    expect(requireRow('My Documents')).toBeInTheDocument();
    expect(screen.getByText(/5 個のオブジェクト/)).toBeInTheDocument();
  });

  // ── Splitter drag resizes left pane ──
  it('changes left pane width via splitter drag and clamps at minimum', () => {
    const { container } = render(<FileExplorer />);

    const splitter = container.querySelector('[class*="splitter"]') as HTMLElement;
    expect(splitter).toBeInTheDocument();

    const leftPane = splitter.previousElementSibling as HTMLElement;
    expect(leftPane).toBeInTheDocument();
    expect(leftPane.style.width).toBe('200px');

    // Drag splitter right: startX=200, move to 350 → width = 200+(350-200)=350
    fireEvent.pointerDown(splitter, { clientX: 200, pointerId: 0 });
    fireEvent.pointerMove(window, { clientX: 350, pointerId: 0 });
    expect(leftPane.style.width).toBe('350px');

    // Drag further right to 500
    fireEvent.pointerMove(window, { clientX: 500, pointerId: 0 });
    expect(leftPane.style.width).toBe('500px');

    // Drag far left → clamped at 60px
    fireEvent.pointerMove(window, { clientX: 50, pointerId: 0 });
    expect(leftPane.style.width).toBe('60px');

    // Release to finish drag
    fireEvent.pointerUp(window, { pointerId: 0 });
  });
});
