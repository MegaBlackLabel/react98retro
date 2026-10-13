import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DesktopIcons } from './DesktopIcons';
import type { DesktopIconItem } from './DesktopIcons';

const items: DesktopIconItem[] = [
  { id: 'computer', label: 'マイ コンピュータ', icon: 'data:image/svg+xml,x', x: 0, y: 0 },
  { id: 'docs', label: 'マイ ドキュメント', icon: 'data:image/svg+xml,x', x: 0, y: 80 },
  { id: 'bin', label: 'ゴミ箱', icon: 'data:image/svg+xml,x', x: 0, y: 160 },
];

/** 8px 以上の移動を伴うドラッグを実行する */
function drag(el: HTMLElement, dx: number, dy: number) {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: 10 + dx, clientY: 10 + dy });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 10 + dx, clientY: 10 + dy });
}

describe('DesktopIcons', () => {
  it('renders every icon label', () => {
    render(<DesktopIcons items={items} />);
    expect(screen.getByText('マイ コンピュータ')).toBeInTheDocument();
    expect(screen.getByText('マイ ドキュメント')).toBeInTheDocument();
    expect(screen.getByText('ゴミ箱')).toBeInTheDocument();
  });

  it('has a labelled desktop surface', () => {
    render(<DesktopIcons items={items} />);
    expect(screen.getByLabelText('デスクトップ')).toBeInTheDocument();
  });

  it('calls onSelect with the icon id on click', () => {
    const onSelect = vi.fn();
    render(<DesktopIcons items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'ゴミ箱' }));
    expect(onSelect).toHaveBeenCalledWith('bin');
  });

  it('calls onOpen with the icon id on double click', () => {
    const onOpen = vi.fn();
    render(<DesktopIcons items={items} onOpen={onOpen} />);
    fireEvent.doubleClick(screen.getByRole('button', { name: 'マイ コンピュータ' }));
    expect(onOpen).toHaveBeenCalledWith('computer');
  });

  it('calls onSelect(null) when the empty surface is clicked', () => {
    const onSelect = vi.fn();
    render(<DesktopIcons items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('デスクトップ'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('marks the selected icon with aria-selected and data-selected', () => {
    render(<DesktopIcons items={items} selectedId="docs" />);
    const selected = screen.getByRole('button', { name: 'マイ ドキュメント' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('data-selected');
    expect(screen.getByRole('button', { name: 'ゴミ箱' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('snaps the dragged icon to the grid on pointer up', () => {
    const onMove = vi.fn();
    render(<DesktopIcons items={items} onMove={onMove} gridSize={75} />);
    drag(screen.getByRole('button', { name: 'マイ コンピュータ' }), 80, 10);
    expect(onMove).toHaveBeenCalledTimes(1);
    const [id, position] = onMove.mock.calls[0] as [string, { x: number; y: number }];
    expect(id).toBe('computer');
    expect(position.x % 75).toBe(0);
    expect(position.x).toBe(75);
    expect(position.y).toBe(0);
  });

  it('does not start a drag below the 8px threshold', () => {
    const onMove = vi.fn();
    render(<DesktopIcons items={items} onMove={onMove} gridSize={75} />);
    drag(screen.getByRole('button', { name: 'マイ コンピュータ' }), 4, 4);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('suppresses click and double click right after a drag', () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    render(<DesktopIcons items={items} onSelect={onSelect} onOpen={onOpen} gridSize={75} />);
    const icon = screen.getByRole('button', { name: 'マイ コンピュータ' });
    drag(icon, 80, 0);
    fireEvent.click(icon);
    fireEvent.doubleClick(icon);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
