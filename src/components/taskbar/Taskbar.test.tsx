import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Taskbar } from './Taskbar';
import type { TaskbarItem } from './Taskbar';
import { WindowManagerContext } from '../window/WindowManagerContext';
import type { UseWindowManagerResult } from '../../hooks/useWindowManager';
import type { WindowManagerContextValue } from '../window/WindowManagerContext';

const sampleItems: TaskbarItem[] = [
  { id: 'explorer', title: 'エクスプローラ' },
  { id: 'notepad', title: 'メモ帳', active: true },
  { id: 'minimized', title: '最小化', minimized: true },
];

describe('Taskbar', () => {
  it('renders all item titles', () => {
    render(<Taskbar items={sampleItems} />);
    expect(screen.getByText('エクスプローラ')).toBeInTheDocument();
    expect(screen.getByText('メモ帳')).toBeInTheDocument();
    expect(screen.getByText('最小化')).toBeInTheDocument();
  });

  it('calls onItemClick with id when a task button is clicked', () => {
    const onItemClick = vi.fn();
    render(<Taskbar items={sampleItems} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByText('エクスプローラ'));
    expect(onItemClick).toHaveBeenCalledWith('explorer');
  });

  it('marks active item with aria-pressed=true', () => {
    render(<Taskbar items={sampleItems} />);
    expect(screen.getByRole('button', { name: /メモ帳/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /エクスプローラ/ })).not.toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows the clock prop verbatim', () => {
    render(<Taskbar clock="13:37" />);
    expect(screen.getByText('13:37')).toBeInTheDocument();
  });

  it('renders a HH:MM clock when clock is omitted', () => {
    render(<Taskbar />);
    const clock = screen.getByText(/^\d{2}:\d{2}$/);
    expect(clock).toBeInTheDocument();
  });

  it('hides the tray when showTray is false', () => {
    render(<Taskbar showTray={false} />);
    expect(screen.queryByLabelText('タスクトレイ')).not.toBeInTheDocument();
  });

  it('calls onStartClick when the start button is clicked', () => {
    const onStartClick = vi.fn();
    render(<Taskbar onStartClick={onStartClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }));
    expect(onStartClick).toHaveBeenCalledOnce();
  });

  it('exposes the toolbar role and label', () => {
    render(<Taskbar />);
    expect(screen.getByRole('toolbar', { name: 'タスクバー' })).toBeInTheDocument();
  });

  it('derives items from the window manager context when items are not passed', () => {
    const manager = makeManager({
      windows: {
        'win-a': { id: 'win-a', title: 'マイ コンピュータ', minimized: false, maximized: false, isSnapped: false, zIndex: 1 },
        'win-b': { id: 'win-b', title: 'エクスプローラ', minimized: true, maximized: false, isSnapped: false, zIndex: 2 },
      },
      activeWindowId: 'win-a',
    });

    render(
      <WindowManagerContext.Provider value={manager}>
        <Taskbar />
      </WindowManagerContext.Provider>,
    );

    // 開いた順 (= register された順) に左から並ぶ
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['スタート', 'マイ コンピュータ', 'エクスプローラ']);
    expect(screen.getByRole('button', { name: /マイ コンピュータ/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles windows through the window manager when onItemClick is not given', () => {
    const manager = makeManager({
      windows: {
        'win-a': { id: 'win-a', title: 'マイ コンピュータ', minimized: false, maximized: false, isSnapped: false, zIndex: 1 },
        'win-b': { id: 'win-b', title: 'エクスプローラ', minimized: true, maximized: false, isSnapped: false, zIndex: 2 },
      },
      activeWindowId: 'win-a',
    });

    render(
      <WindowManagerContext.Provider value={manager}>
        <Taskbar />
      </WindowManagerContext.Provider>,
    );

    // 最小化中のウィンドウ → 復元 + 前面化
    fireEvent.click(screen.getByRole('button', { name: /エクスプローラ/ }));
    expect(manager.restore).toHaveBeenCalledWith('win-b');
    expect(manager.focus).toHaveBeenCalledWith('win-b');

    // 最前面のウィンドウ → 最小化
    fireEvent.click(screen.getByRole('button', { name: /マイ コンピュータ/ }));
    expect(manager.minimize).toHaveBeenCalledWith('win-a');
  });
});

/** テスト用の最小ウィンドウマネージャ */
function makeManager(overrides: {
  windows: UseWindowManagerResult['windows'];
  activeWindowId: string | null;
}): WindowManagerContextValue {
  return {
    windows: overrides.windows,
    activeWindowId: overrides.activeWindowId,
    geometries: {},
    moveRequests: {},
    resizeRequests: {},
    preShrinkGeometries: {},
    autoMoveOnSnap: false,
    isMobile: false,
    focus: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    restore: vi.fn(),
    close: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    isActive: (id: string) => id === overrides.activeWindowId,
    updateGeometry: vi.fn(),
    getAllGeometries: () => ({}),
    requestMove: vi.fn(),
    clearMoveRequest: vi.fn(),
    requestResize: vi.fn(),
    clearResizeRequest: vi.fn(),
    restoreShrink: vi.fn(),
    setWindowSnapped: vi.fn(),
  };
}
