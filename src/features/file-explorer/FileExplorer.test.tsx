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
});
