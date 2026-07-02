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

  it('has role=toolbar on container', () => {
    const { container } = render(<Toolbar items={sampleItems} />);
    expect(container.firstChild).toHaveAttribute('role', 'toolbar');
  });


  describe('dropdown', () => {
    it('opens on click, closes on second click, and calls menu item callback', () => {
      const onItemClick = vi.fn();
      const items: ToolbarItemDef[] = [
        {
          type: 'dropdown',
          id: 'view',
          tooltip: 'View',
          items: [{ label: 'Large Icons', onClick: onItemClick }],
        },
      ];
      render(<Toolbar items={items} />);
      const button = screen.getByRole('button', { name: 'View' });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Large Icons' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('menuitem', { name: 'Large Icons' }));
      expect(onItemClick).toHaveBeenCalledOnce();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('does not open when disabled', () => {
      const items: ToolbarItemDef[] = [
        {
          type: 'dropdown',
          id: 'view',
          tooltip: 'View',
          disabled: true,
          items: [{ label: 'Large Icons' }],
        },
      ];
      render(<Toolbar items={items} />);
      const button = screen.getByRole('button', { name: 'View' });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes on outside mousedown and sets aria-expanded=false', () => {
      const items: ToolbarItemDef[] = [
        {
          type: 'dropdown',
          id: 'view',
          tooltip: 'View',
          items: [{ label: 'Large Icons' }],
        },
      ];
      render(<Toolbar items={items} />);
      const button = screen.getByRole('button', { name: 'View' });
      fireEvent.click(button);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('splitButton', () => {
    it('renders SplitButton through toolbar and opens its menu', () => {
      const onItemClick = vi.fn();
      const items: ToolbarItemDef[] = [
        {
          type: 'splitButton',
          id: 'cut',
          icon: 'cut.png',
          tooltip: 'Cut',
          items: [{ label: 'Cut Item', onClick: onItemClick }],
        },
      ];
      render(<Toolbar items={items} />);
      const button = screen.getByRole('button', { name: /メニューを開く/ });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Cut Item' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('menuitem', { name: 'Cut Item' }));
      expect(onItemClick).toHaveBeenCalledOnce();
    });
  });

  describe('tooltip unmount cleanup', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('does not warn on state update after unmount', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { unmount } = render(<Toolbar items={[{ type: 'button', id: 'btn', tooltip: 'Tip' }]} />);
      const button = screen.getByRole('button', { name: 'Tip' });
      fireEvent.mouseEnter(button);
      unmount();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('pressed state', () => {
    it('renders aria-pressed and pressed visual class when pressed is true', () => {
      const items: ToolbarItemDef[] = [
        { type: 'button', id: 'bold', tooltip: 'Bold', pressed: true },
      ];
      render(<Toolbar items={items} />);
      const button = screen.getByRole('button', { name: 'Bold' });
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button.className).toMatch(/toolbarButtonPressed/);
    });
  });

});
