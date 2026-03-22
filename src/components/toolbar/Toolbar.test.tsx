import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Toolbar } from './Toolbar';
import type { ToolbarItemDef } from './Toolbar';

const sampleItems: ToolbarItemDef[] = [
  { type: 'button', id: 'back', tooltip: 'Go Back', onClick: vi.fn() },
  { type: 'button', id: 'forward', tooltip: 'Go Forward', onClick: vi.fn() },
  { type: 'separator' },
  { type: 'button', id: 'disabled', tooltip: 'Disabled', disabled: true, onClick: vi.fn() },
];

describe('Toolbar', () => {
  it('renders all button items', () => {
    render(<Toolbar items={sampleItems} />);
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Forward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeInTheDocument();
  });

  it('clicking button calls onClick', () => {
    const onClick = vi.fn();
    const items: ToolbarItemDef[] = [
      { type: 'button', id: 'test', tooltip: 'Click Me', onClick },
    ];
    render(<Toolbar items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disabled button does not call onClick', () => {
    const onClick = vi.fn();
    const items: ToolbarItemDef[] = [
      { type: 'button', id: 'test', tooltip: 'Disabled Btn', disabled: true, onClick },
    ];
    render(<Toolbar items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disabled Btn' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('separator renders correctly', () => {
    render(<Toolbar items={sampleItems} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  describe('tooltip', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('tooltip shows after 500ms hover', async () => {
      render(
        <Toolbar
          items={[{ type: 'button', id: 'btn', tooltip: 'Go Back' }]}
        />,
      );
      const button = screen.getByRole('button', { name: 'Go Back' });
      fireEvent.mouseEnter(button);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('tooltip does not show before 500ms', async () => {
      render(
        <Toolbar
          items={[{ type: 'button', id: 'btn', tooltip: 'Go Back' }]}
        />,
      );
      const button = screen.getByRole('button', { name: 'Go Back' });
      fireEvent.mouseEnter(button);
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
