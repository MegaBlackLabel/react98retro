import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { StartMenu } from './StartMenu';
import type { StartMenuItem } from './StartMenu';

const basicItems: StartMenuItem[] = [
  { type: 'item', label: 'ドキュメント', onClick: () => {} },
  { type: 'separator' },
  { type: 'item', label: '設定', onClick: () => {} },
];

describe('StartMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders menu with aria-label and items', () => {
    render(<StartMenu items={basicItems} />);

    expect(screen.getByRole('menu', { name: 'スタート メニュー' })).toBeInTheDocument();
    expect(screen.getByText('ドキュメント')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('calls onClick and onClose when an enabled item is clicked', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();

    render(<StartMenu items={[{ type: 'item', label: '設定', onClick }]} onClose={onClose} />);

    fireEvent.click(screen.getByText('設定'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the menu open when the press lands on an ignored element', () => {
    const onClose = vi.fn();

    render(
      <>
        <button type="button" aria-label="スタート">
          スタート
        </button>
        <StartMenu items={basicItems} onClose={onClose} ignoreOutsidePressSelector='[aria-label="スタート"]' />
      </>,
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: 'スタート' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick or onClose for a disabled item', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();

    render(
      <StartMenu items={[{ type: 'item', label: '無効', disabled: true, onClick }]} onClose={onClose} />,
    );

    const row = screen.getByText('無効').closest('[role="menuitem"]');
    expect(row).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByText('無効'));
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<StartMenu items={basicItems} onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('menu', { name: 'スタート メニュー' }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when mousedown happens outside', () => {
    const onClose = vi.fn();
    render(<StartMenu items={basicItems} onClose={onClose} />);

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when mousedown happens inside', () => {
    const onClose = vi.fn();
    render(<StartMenu items={basicItems} onClose={onClose} />);

    fireEvent.mouseDown(screen.getByText('ドキュメント'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves the active item with ArrowDown and skips separators', () => {
    render(<StartMenu items={basicItems} />);

    const menu = screen.getByRole('menu', { name: 'スタート メニュー' });
    const documents = screen.getByText('ドキュメント').closest('[role="menuitem"]');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(documents).toHaveAttribute('data-active', 'true');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // 区切りを飛ばして「設定」がアクティブになる
    expect(documents).not.toHaveAttribute('data-active');
    expect(screen.getByText('設定').closest('[role="menuitem"]')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('activates the active item with Enter', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    render(<StartMenu items={[{ type: 'item', label: '実行', onClick }]} onClose={onClose} />);

    const menu = screen.getByRole('menu', { name: 'スタート メニュー' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens a submenu on hover after 150ms', () => {
    render(
      <StartMenu
        items={[
          { type: 'submenu', label: 'プログラム', items: [{ type: 'item', label: 'アクセサリ' }] },
        ]}
      />,
    );

    const parent = screen.getByText('プログラム').closest('[role="menuitem"]')!;
    expect(parent).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.queryByText('アクセサリ')).not.toBeInTheDocument();

    fireEvent.mouseEnter(parent);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('アクセサリ')).toBeInTheDocument();
  });

  it('closes the submenu when the hover leaves', () => {
    render(
      <StartMenu
        items={[
          { type: 'submenu', label: 'プログラム', items: [{ type: 'item', label: 'アクセサリ' }] },
        ]}
      />,
    );

    const parent = screen.getByText('プログラム').closest('[role="menuitem"]')!;
    fireEvent.mouseEnter(parent);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('アクセサリ')).toBeInTheDocument();

    fireEvent.mouseLeave(parent);
    expect(screen.queryByText('アクセサリ')).not.toBeInTheDocument();
  });

  it('opens a submenu with ArrowRight', () => {
    render(
      <StartMenu
        items={[
          { type: 'item', label: 'ドキュメント' },
          { type: 'submenu', label: 'プログラム', items: [{ type: 'item', label: 'アクセサリ' }] },
        ]}
      />,
    );

    const menu = screen.getByRole('menu', { name: 'スタート メニュー' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowRight' });

    expect(screen.getByText('アクセサリ')).toBeInTheDocument();

    fireEvent.keyDown(menu, { key: 'ArrowLeft' });
    expect(screen.queryByText('アクセサリ')).not.toBeInTheDocument();
  });

  it('renders the banner text', () => {
    render(<StartMenu items={basicItems} bannerText="Windows 98" />);
    expect(screen.getByText('Windows 98')).toBeInTheDocument();
  });
});
