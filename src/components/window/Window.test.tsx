import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from 'vitest';
import { Window } from './Window';
import { WindowManagerContext, type WindowManagerContextValue } from './WindowManagerContext';
import type { UseWindowManagerResult } from '../../hooks/useWindowManager';
import styles from './Window.module.css';

function createPointerEvent(type: string, init: PointerEventInit) {
  return new PointerEvent(type, init);
}

describe('Window', () => {
  it('renders with title bar and window body', () => {
    render(<Window title="My Window"><p>Body content</p></Window>);
    expect(screen.getByText('My Window')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('hides body when minimized=true', () => {
    render(<Window title="My Window" minimized><p>Hidden content</p></Window>);
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('applies zIndex to container', () => {
    const { container } = render(<Window title="Test" zIndex={99} />);
    const windowEl = container.firstChild as HTMLElement;
    expect(windowEl.style.zIndex).toBe('99');
  });

  it('forwards arbitrary DOM props to the root element', () => {
    render(<Window title="Test" data-testid="explorer-window" aria-label="Explorer" />);
    const windowEl = screen.getByTestId('explorer-window');
    expect(windowEl).toHaveAttribute('aria-label', 'Explorer');
    expect(windowEl.className).toContain('window');
  });

  it('keeps Window-specific props off the DOM node', () => {
    render(
      <Window
        title="Test"
        data-testid="explorer-window"
        initialX={120}
        initialY={80}
        width={640}
        height={480}
      />,
    );
    const windowEl = screen.getByTestId('explorer-window');
    expect(windowEl).not.toHaveAttribute('initialX');
    expect(windowEl).not.toHaveAttribute('title');
    expect(windowEl.style.width).toBe('640px');
    expect(windowEl.style.left).toBe('120px');
  });

  it('calls a consumer onPointerDown as well as focusing the window', () => {
    const onPointerDown = vi.fn();
    render(<Window title="Test" data-testid="explorer-window" onPointerDown={onPointerDown} />);
    fireEvent.pointerDown(screen.getByTestId('explorer-window'));
    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it('adds dialog semantics, focus, and a backdrop when modal', () => {
    render(<Window title="Confirm" modal />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Confirm');
    expect(dialog).toHaveFocus();
    expect(dialog.querySelector('[data-window-modal-backdrop]')).not.toBeNull();
  });

  it('keeps an explicit role on a modal window', () => {
    render(<Window title="Confirm" modal role="alertdialog" aria-label="Danger" />);
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Danger');
  });

  it('calls onClose when Escape is pressed on a modal window', () => {
    const onClose = vi.fn();
    render(<Window title="Confirm" modal onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not add dialog semantics when not modal', () => {
    render(<Window title="Plain" />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-window-modal-backdrop]')).toBeNull();
  });

  it('raises the active window z-index when dragging starts', () => {
    const { container } = render(<Window title="Test" zIndex={99} />);
    const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
    titleBar.setPointerCapture = vi.fn();
    titleBar.releasePointerCapture = vi.fn();
    const windowEl = container.firstChild as HTMLElement;

    act(() => {
      titleBar.dispatchEvent(
        createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
      );
    });

    expect(windowEl.style.zIndex).toBe('100');
  });

  it('renders status bar when provided', () => {
    render(
      <Window title="Test" statusBar={<div>Status content</div>}>
        <p>Body</p>
      </Window>,
    );
    expect(screen.getByText('Status content')).toBeInTheDocument();
  });

  it('shows the size grip only when a status bar is present', () => {
    // 実物のグリップはステータスバーの右端に描かれるので、ステータスバーが無い
    // ウィンドウには出さない (リサイズ自体は不可視のハンドルでできる)。
    const { container: withoutStatusBar } = render(
      <Window title="Test">
        <p>Body</p>
      </Window>,
    );
    expect(withoutStatusBar.querySelector(`.${styles.sizeGrip}`)).toBeNull();

    const { container: withStatusBar } = render(
      <Window title="Test" statusBar={<div>Status content</div>}>
        <p>Body</p>
      </Window>,
    );
    expect(withStatusBar.querySelector(`.${styles.sizeGrip}`)).not.toBeNull();
  });

  it('hides status bar when minimized', () => {
    render(
      <Window title="Test" minimized statusBar={<div>Status content</div>}>
        <p>Body</p>
      </Window>,
    );
    expect(screen.queryByText('Status content')).toBeNull();
  });

  describe('snap preview behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders a preview while dragging into the right snap zone', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} zIndex={99} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).not.toBeNull();
      });

      const preview = container.querySelector(`.${styles.snapPreview}`) as HTMLElement;
      expect(preview).toHaveClass(styles.snapPreview);
      expect(preview).toHaveAttribute('aria-hidden', 'true');
      expect(preview.getAttribute('role')).toBeNull();
      expect(preview.style.top).toBe('0px');
      expect(preview.style.left).toBe('512px');
      expect(preview.style.width).toBe('512px');
      expect(preview.style.height).toBe('768px');
      expect(preview.style.zIndex).toBe('101');
      expect(container.firstChild?.nextSibling).toBe(preview);
    });

    it('removes the preview after pointerup', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
      });
    });

    it('removes the preview when leaving the snap zone before pointerup', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 512, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
      });
    });

    it('does not render a preview when snapEnabled is false', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} snapEnabled={false} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
      });
    });

    it('does not snap at 41px from the edge with snapThreshold=40', async () => {
      const { container } = render(
        <Window title="My Window" width={400} height={300} snapThreshold={40} />,
      );
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 983, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 983, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
        expect(windowEl.style.width).toBe('400px');
        expect(windowEl.style.height).toBe('300px');
      });
    });

    it('snaps at 39px from the edge with snapThreshold=40', async () => {
      const { container } = render(
        <Window title="My Window" width={400} height={300} snapThreshold={40} />,
      );
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 985, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 985, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
        expect(windowEl.style.left).toBe('512px');
        expect(windowEl.style.top).toBe('0px');
        expect(windowEl.style.width).toBe('512px');
        expect(windowEl.style.height).toBe('768px');
      });
    });

    it('does not show a snap preview while maximized and restores to the original size', async () => {
      const onRestore = vi.fn();
      const { container } = render(
        <Window title="My Window" width={400} height={300} maximized onRestore={onRestore} />,
      );
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();

      await userEvent.click(screen.getByRole('button', { name: 'Restore' }));

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledOnce();
        expect(windowEl.style.width).toBe('400px');
        expect(windowEl.style.height).toBe('300px');
      });
    });

    it('ignores pointerdown on title-bar buttons for snap dragging', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const minimizeButton = screen.getByRole('button', { name: 'Minimize' });

      act(() => {
        minimizeButton.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(titleBar.setPointerCapture).not.toHaveBeenCalled();
        expect(container.querySelector(`.${styles.snapPreview}`)).toBeNull();
      });
    });
  });

  it('calls onClose callback', async () => {
    const onClose = vi.fn();
    render(<Window title="Test" onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    closeBtn.click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  describe('title bar control flags', () => {
    it('hides the Minimize/Maximize buttons passed from Window', () => {
      render(<Window title="Test" minimizable={false} maximizable={false} />);
      expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('hides the Close button when closable=false', () => {
      render(<Window title="Test" closable={false} />);
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    });

    it('forwards the disabled flags to the title bar buttons', () => {
      render(<Window title="Test" minimizeDisabled maximizeDisabled closeDisabled />);
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });

    it('keeps the Maximize button disabled while minimized', () => {
      render(<Window title="Test" minimized />);
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeDisabled();
    });

    it('keeps the title bar control flags off the DOM node', () => {
      render(
        <Window
          title="Test"
          data-testid="explorer-window"
          minimizable={false}
          maximizable={false}
          closable={false}
          minimizeDisabled
          maximizeDisabled
          closeDisabled
        />,
      );
      const windowEl = screen.getByTestId('explorer-window');
      expect(windowEl).not.toHaveAttribute('minimizable');
      expect(windowEl).not.toHaveAttribute('maximizable');
      expect(windowEl).not.toHaveAttribute('closable');
      expect(windowEl).not.toHaveAttribute('minimizeDisabled');
      expect(windowEl).not.toHaveAttribute('maximizeDisabled');
      expect(windowEl).not.toHaveAttribute('closeDisabled');
    });

    // closable=false は「閉じるボタンを描かない」だけで、Escape の閉じる導線は残す
    it('still closes a modal window with Escape when closable=false', () => {
      const onClose = vi.fn();
      render(<Window title="Confirm" modal closable={false} onClose={onClose} />);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('resizable flag', () => {
    it('renders all eight resize handles by default', () => {
      const { container } = render(<Window title="Test" width={400} height={300} />);
      expect(container.querySelectorAll(`.${styles.resizeHandle}`)).toHaveLength(8);
    });

    it('does not render resize handles when resizable=false', () => {
      const { container } = render(
        <Window title="Test" width={400} height={300} resizable={false} />,
      );
      expect(container.querySelectorAll(`.${styles.resizeHandle}`)).toHaveLength(0);
    });

    // サイズ グリップは se ハンドルの見える版なので、resizable=false では描かない
    it('does not render the status bar size grip when resizable=false', () => {
      const { container } = render(
        <Window title="Test" resizable={false} statusBar={<div>Status content</div>} />,
      );
      expect(container.querySelector(`.${styles.sizeGrip}`)).toBeNull();
    });

    it('keeps the window size fixed when the pointer is pressed and moved', () => {
      const { container } = render(
        <Window title="Test" width={400} height={300} resizable={false} />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        windowEl.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 600, clientY: 500, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 600, clientY: 500, pointerId: 1 }));
      });

      expect(windowEl.style.width).toBe('400px');
      expect(windowEl.style.height).toBe('300px');
    });

    it('keeps the resizable flag off the DOM node', () => {
      render(<Window title="Test" data-testid="explorer-window" resizable={false} />);
      expect(screen.getByTestId('explorer-window')).not.toHaveAttribute('resizable');
    });
  });

  describe('maximized lock (restorable=false)', () => {
    it('stays maximized when the title bar is double-clicked', () => {
      const onRestore = vi.fn();
      const onMaximize = vi.fn();
      const { container } = render(
        <Window
          title="Test"
          width={400}
          height={300}
          maximized
          restorable={false}
          onRestore={onRestore}
          onMaximize={onMaximize}
        />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;

      fireEvent.doubleClick(titleBar);

      expect(onRestore).not.toHaveBeenCalled();
      expect(onMaximize).not.toHaveBeenCalled();
      expect(windowEl.style.width).toBe('100vw');
      expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    });

    it('keeps the Restore button disabled', () => {
      render(<Window title="Test" maximized restorable={false} />);
      expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();
    });

    it('does not move when the title bar is dragged', () => {
      const { container } = render(
        <Window title="Test" width={400} height={300} maximized restorable={false} />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 300, clientY: 300, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 300, clientY: 300, pointerId: 1 }));
      });

      expect(titleBar.setPointerCapture).not.toHaveBeenCalled();
      expect(windowEl.style.top).toBe('0px');
      expect(windowEl.style.left).toBe('0px');
      expect(windowEl.style.width).toBe('100vw');
    });

    it('restores on title bar double-click while maximized by default', async () => {
      const onRestore = vi.fn();
      const { container } = render(
        <Window title="Test" width={400} height={300} maximized onRestore={onRestore} />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;

      fireEvent.doubleClick(titleBar);

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledOnce();
        expect(windowEl.style.width).toBe('400px');
        expect(windowEl.style.height).toBe('300px');
      });
    });

    // restorable=false は「最大化のまま固定」。最大化そのものは禁止しない
    it('still maximizes a non-maximized window and then keeps it maximized', () => {
      const onMaximize = vi.fn();
      const onRestore = vi.fn();
      const { container } = render(
        <Window
          title="Test"
          width={400}
          height={300}
          restorable={false}
          onMaximize={onMaximize}
          onRestore={onRestore}
        />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;

      fireEvent.doubleClick(titleBar);
      expect(onMaximize).toHaveBeenCalledOnce();
      expect(windowEl.style.width).toBe('100vw');

      fireEvent.doubleClick(titleBar);
      expect(onRestore).not.toHaveBeenCalled();
      expect(windowEl.style.width).toBe('100vw');
    });

    it('keeps the restorable flag off the DOM node', () => {
      render(<Window title="Test" data-testid="explorer-window" restorable={false} />);
      expect(screen.getByTestId('explorer-window')).not.toHaveAttribute('restorable');
    });
  });

  describe('snap commit behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('snaps to the right half on commit', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(windowEl.style.left).toBe('512px');
        expect(windowEl.style.top).toBe('0px');
        expect(windowEl.style.width).toBe('512px');
        expect(windowEl.style.height).toBe('768px');
      });
    });

    it('snaps to the top half on commit', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 512, clientY: 10, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 512, clientY: 10, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(windowEl.style.left).toBe('0px');
        expect(windowEl.style.top).toBe('0px');
        expect(windowEl.style.width).toBe('1024px');
        expect(windowEl.style.height).toBe('384px');
      });
    });

    it('restores the floating size when dragging a snapped window away from the edge', async () => {
      const { container } = render(<Window title="My Window" width={400} height={300} />);
      const titleBar = screen.getByText('My Window').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.firstChild as HTMLElement;

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(windowEl.style.left).toBe('512px');
        expect(windowEl.style.top).toBe('0px');
        expect(windowEl.style.width).toBe('512px');
        expect(windowEl.style.height).toBe('768px');
      });

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 600, clientY: 100, pointerId: 2, bubbles: true }),
        );
      });

      expect(windowEl.style.width).toBe('400px');
      expect(windowEl.style.height).toBe('300px');
    });
  });

  describe('responsive sizing', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('adjusts initial size to fit narrow viewport', () => {
      const { container } = render(
        <Window title="Test" width={780} height={500} initialX={20} initialY={20} />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const width = parseInt(windowEl.style.width, 10);
      expect(width).toBeLessThanOrEqual(400);
    });

    it('positions window within viewport on mobile', () => {
      const { container } = render(
        <Window title="Test" width={300} height={300} initialX={500} initialY={600} />,
      );
      const windowEl = container.firstChild as HTMLElement;
      const left = parseInt(windowEl.style.left, 10);
      const top = parseInt(windowEl.style.top, 10);
      expect(left + 300).toBeLessThanOrEqual(400);
      expect(top + 300).toBeLessThanOrEqual(700);
    });
  });

  describe('viewport resize reconciliation', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('re-clamps window position when viewport shrinks after mount', async () => {
      const { container } = render(
        <Window title="Test" width={600} height={400} initialX={100} initialY={100} />,
      );
      
      const windowEl = container.firstChild as HTMLElement;
      
      // Initial position should be within original viewport
      const initialLeft = parseInt(windowEl.style.left, 10);
      const initialTop = parseInt(windowEl.style.top, 10);
      expect(initialLeft).toBe(100);
      expect(initialTop).toBe(100);
      
      // Simulate viewport shrink (e.g., orientation change or window resize)
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Wait for the effect to run and state to update
      await waitFor(() => {
        const newLeft = parseInt(windowEl.style.left, 10);
        const newTop = parseInt(windowEl.style.top, 10);
        const newWidth = parseInt(windowEl.style.width, 10);
        const newHeight = parseInt(windowEl.style.height, 10);
        
        // Window should now be clamped to the smaller viewport
        expect(newLeft + newWidth).toBeLessThanOrEqual(400);
        expect(newTop + newHeight).toBeLessThanOrEqual(400);
      });
    });

    it('re-clamps window size when viewport shrinks after mount', async () => {
      const { container } = render(
        <Window title="Test" width={700} height={500} initialX={50} initialY={50} />,
      );
      
      const windowEl = container.firstChild as HTMLElement;
      
      // Initial size should be clamped to original viewport
      const initialWidth = parseInt(windowEl.style.width, 10);
      expect(initialWidth).toBeLessThanOrEqual(800);
      
      // Simulate viewport shrink
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Wait for the effect to run
      await waitFor(() => {
        const newWidth = parseInt(windowEl.style.width, 10);
        const newHeight = parseInt(windowEl.style.height, 10);
        
        // Window size should now be clamped to the smaller viewport
        expect(newWidth).toBeLessThanOrEqual(400);
        expect(newHeight).toBeLessThanOrEqual(300);
      });
    });
  });
});

  describe('WindowManagerContext integration', () => {
    type ManagerSpies = {
      requestMove: (id: string, position: UseWindowManagerResult['moveRequests'][string]) => void;
      requestResize: Mock<(id: string, rect: UseWindowManagerResult['resizeRequests'][string]) => void>;
      clearMoveRequest: (id: string) => void;
      clearResizeRequest: (id: string) => void;
      restoreShrink: (id: string) => void;
      setWindowSnapped: (id: string, isSnapped: boolean) => void;
    };

    function snapWindow(title: string, pointerX: number, pointerY: number) {
      const titleBar = screen.getByText(title).closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: pointerX, clientY: pointerY, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: pointerX, clientY: pointerY, pointerId: 1 }));
      });
    }

    function StatefulWindowManager({
      children,
      windows,
      autoMoveOnSnap = false,
      initialGeometries = {},
      initialMoveRequests = {},
      initialResizeRequests = {},
      initialPreShrinkGeometries = {},
      spies,
    }: {
      children: ReactNode;
      windows: UseWindowManagerResult['windows'];
      autoMoveOnSnap?: boolean;
      initialGeometries?: UseWindowManagerResult['geometries'];
      initialMoveRequests?: UseWindowManagerResult['moveRequests'];
      initialResizeRequests?: UseWindowManagerResult['resizeRequests'];
      initialPreShrinkGeometries?: UseWindowManagerResult['preShrinkGeometries'];
      spies: ManagerSpies;
    }) {
      const [geometries, setGeometries] = useState<UseWindowManagerResult['geometries']>(initialGeometries);
      const [moveRequests, setMoveRequests] = useState<UseWindowManagerResult['moveRequests']>(initialMoveRequests);
      const [resizeRequests, setResizeRequests] = useState<UseWindowManagerResult['resizeRequests']>(initialResizeRequests);
      const [preShrinkGeometries, setPreShrinkGeometries] = useState<UseWindowManagerResult['preShrinkGeometries']>(initialPreShrinkGeometries);
      const [windowStates, setWindowStates] = useState<UseWindowManagerResult['windows']>(windows);
      const geometriesRef = useRef(geometries);
      const staticMethods = useRef({
        focus: vi.fn(),
        minimize: vi.fn(),
        maximize: vi.fn(),
        restore: vi.fn(),
        close: vi.fn(),
        register: vi.fn(),
        unregister: vi.fn(),
        isActive: vi.fn((id: string) => id === 'win-b'),
      });

      const updateGeometry = useCallback((id: string, geometry: UseWindowManagerResult['geometries'][string]) => {
        geometriesRef.current = { ...geometriesRef.current, [id]: geometry };
        setGeometries(geometriesRef.current);
      }, []);

      const getAllGeometries = useCallback(() => geometriesRef.current, []);

      const requestMove = useCallback((id: string, position: UseWindowManagerResult['moveRequests'][string]) => {
        spies.requestMove(id, position);
        setMoveRequests((current) => ({ ...current, [id]: position }));
      }, [spies]);

      const clearMoveRequest = useCallback((id: string) => {
        spies.clearMoveRequest(id);
        setMoveRequests((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }, [spies]);

      const requestResize = useCallback((id: string, rect: UseWindowManagerResult['resizeRequests'][string]) => {
        spies.requestResize(id, rect);
        setPreShrinkGeometries((current) => current[id] ? current : { ...current, [id]: geometriesRef.current[id] });
        setResizeRequests((current) => ({ ...current, [id]: rect }));
      }, [spies]);

      const clearResizeRequest = useCallback((id: string) => {
        spies.clearResizeRequest(id);
        setResizeRequests((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }, [spies]);

      const restoreShrink = useCallback((id: string) => {
        spies.restoreShrink(id);
        setPreShrinkGeometries((current) => {
          const preShrinkGeometry = current[id];
          if (preShrinkGeometry) {
            geometriesRef.current = { ...geometriesRef.current, [id]: preShrinkGeometry };
            setGeometries(geometriesRef.current);
            setResizeRequests((resizeCurrent) => ({ ...resizeCurrent, [id]: preShrinkGeometry }));
          }

          const next = { ...current };
          delete next[id];
          return next;
        });
        setResizeRequests((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }, [spies]);

      const setWindowSnapped = useCallback((id: string, isSnapped: boolean) => {
        spies.setWindowSnapped(id, isSnapped);
        setWindowStates((current) => {
          if (!current[id]) return current;
          return { ...current, [id]: { ...current[id], isSnapped } };
        });
      }, [spies]);

      const context = useMemo<WindowManagerContextValue>(
        () => ({
          windows: windowStates,
          activeWindowId: 'win-b',
          geometries,
          moveRequests,
          resizeRequests,
          preShrinkGeometries,
          autoMoveOnSnap,
          isMobile: false,
          ...staticMethods.current,
          updateGeometry,
          getAllGeometries,
          requestMove,
          clearMoveRequest,
          requestResize,
          clearResizeRequest,
          restoreShrink,
          setWindowSnapped,
        }),
        [
          autoMoveOnSnap,
          clearMoveRequest,
          clearResizeRequest,
          geometries,
          getAllGeometries,
          moveRequests,
          preShrinkGeometries,
          requestMove,
          requestResize,
          resizeRequests,
          restoreShrink,
          setWindowSnapped,
          updateGeometry,
          windowStates,
        ],
      );

      return <WindowManagerContext.Provider value={context}>{children}</WindowManagerContext.Provider>;
    }

    function createManagerSpies(): ManagerSpies {
      return {
        requestMove: vi.fn<(id: string, position: UseWindowManagerResult['moveRequests'][string]) => void>(),
        requestResize: vi.fn<(id: string, rect: UseWindowManagerResult['resizeRequests'][string]) => void>(),
        clearMoveRequest: vi.fn<(id: string) => void>(),
        clearResizeRequest: vi.fn<(id: string) => void>(),
        restoreShrink: vi.fn<(id: string) => void>(),
        setWindowSnapped: vi.fn<(id: string, isSnapped: boolean) => void>(),
      };
    }

    const managedWindows = {
      'win-a': { id: 'win-a', minimized: false, maximized: false, isSnapped: false, zIndex: 1 },
      'win-b': { id: 'win-b', minimized: false, maximized: false, isSnapped: false, zIndex: 2 },
    };

    function createMockContext(overrides?: Partial<UseWindowManagerResult>): WindowManagerContextValue {
      const mockWindows = overrides?.windows ?? {};
      const mockActiveWindowId = overrides?.activeWindowId ?? null;
      const mockGeometries = overrides?.geometries ?? {};
      const mockMoveRequests = overrides?.moveRequests ?? {};
      const mockResizeRequests = overrides?.resizeRequests ?? {};
      const mockPreShrinkGeometries = overrides?.preShrinkGeometries ?? {};
      return {
        windows: mockWindows,
        activeWindowId: mockActiveWindowId,
        geometries: mockGeometries,
        moveRequests: mockMoveRequests,
        resizeRequests: mockResizeRequests,
        preShrinkGeometries: mockPreShrinkGeometries,
        autoMoveOnSnap: overrides?.autoMoveOnSnap ?? false,
        isMobile: false,
        focus: vi.fn(),
        minimize: vi.fn(),
        maximize: vi.fn(),
        restore: vi.fn(),
        close: vi.fn(),
        register: vi.fn(),
        unregister: vi.fn(),
        isActive: vi.fn((id: string) => id === mockActiveWindowId),
        updateGeometry: vi.fn(),
        getAllGeometries: vi.fn(() => mockGeometries),
        requestMove: vi.fn(),
        clearMoveRequest: vi.fn(),
        requestResize: vi.fn(),
        clearResizeRequest: vi.fn(),
        restoreShrink: vi.fn(),
        setWindowSnapped: vi.fn(),
      };
    }

    it('does not keep snapped window ids in module-level mutable state', () => {
      const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Window.tsx'), 'utf8');

      expect(source).not.toContain('snappedWindowIds');
      expect(source).not.toContain('new Set<string>()');
    });

    it('managed window registers on mount', () => {
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      expect(context.register).toHaveBeenCalledWith('win-1', { title: 'Test', icon: undefined });
    });

    it('managed window registers its title and icon (タスクバー表示用)', () => {
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="マイ コンピュータ" icon="/icons/pc.svg" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      expect(context.register).toHaveBeenCalledWith('win-1', { title: 'マイ コンピュータ', icon: '/icons/pc.svg' });
    });

    it('managed minimize goes through the window manager', () => {
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
      expect(context.minimize).toHaveBeenCalledWith('win-1');
    });

    it('renders nothing when the window manager reports the window minimized', () => {
      const context = createMockContext({
        windows: { 'win-1': { id: 'win-1', minimized: true, maximized: false, isSnapped: false, zIndex: 3 } },
      });
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      expect(container.querySelector('.window')).toBeNull();
    });

    it('double-clicking the title bar toggles maximize through the manager', () => {
      const context = createMockContext({
        windows: { 'win-1': { id: 'win-1', minimized: false, maximized: false, isSnapped: false, zIndex: 1 } },
      });
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;

      fireEvent.doubleClick(titleBar);
      expect(context.maximize).toHaveBeenCalledWith('win-1');
    });

    it('does not restore a managed window through the manager when restorable=false', () => {
      const context = createMockContext({
        windows: { 'win-1': { id: 'win-1', minimized: false, maximized: true, isSnapped: false, zIndex: 1 } },
      });
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" maximized restorable={false} />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;

      fireEvent.doubleClick(titleBar);
      fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

      expect(context.restore).not.toHaveBeenCalled();
    });

    it('updates the taskbar title without unregistering when the title changes', () => {
      const context = createMockContext();
      const { rerender } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="マイ コンピュータ" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      expect(context.register).toHaveBeenLastCalledWith('win-1', { title: 'マイ コンピュータ', icon: undefined });

      rerender(
        <WindowManagerContext.Provider value={context}>
          <Window title="Program Files" windowId="win-1" />
        </WindowManagerContext.Provider>
      );

      // 動的タイトル (フォルダ移動など) で unregister/register を繰り返さないこと
      expect(context.unregister).not.toHaveBeenCalled();
      expect(context.register).toHaveBeenLastCalledWith('win-1', { title: 'Program Files', icon: undefined });
    });

    it('managed window unregisters on unmount', () => {
      const context = createMockContext();
      const { unmount } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      unmount();
      expect(context.unregister).toHaveBeenCalledWith('win-1');
    });

    it('clicking managed window calls focus', () => {
      const context = createMockContext();
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const windowEl = container.querySelector('.window') as HTMLElement;
      act(() => {
        windowEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      });
      expect(context.focus).toHaveBeenCalledWith('win-1');
    });

    it('clicking button inside managed window also calls focus', () => {
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      act(() => {
        closeBtn.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      });
      expect(context.focus).toHaveBeenCalledWith('win-1');
    });

    it('unfocused managed window passes inactive to TitleBar', () => {
      const context = createMockContext({ activeWindowId: 'other-window' });
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
      expect(titleBar).toHaveClass('inactive');
    });

    it('focused managed window does not pass inactive to TitleBar', () => {
      const context = createMockContext({ activeWindowId: 'win-1' });
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
      expect(titleBar).not.toHaveClass('inactive');
    });

    it('unmanaged window uses local z-index (backward compat)', () => {
      const { container } = render(<Window title="Test" zIndex={42} />);
      const windowEl = container.firstChild as HTMLElement;
      expect(windowEl.style.zIndex).toBe('42');
    });

    it('managed window gets zIndex from context', () => {
      const context = createMockContext({
        windows: { 'win-1': { id: 'win-1', minimized: false, maximized: false, isSnapped: false, zIndex: 99 } },
        activeWindowId: 'win-1',
      });
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const windowEl = container.querySelector('.window') as HTMLElement;
      expect(windowEl.style.zIndex).toBe('99');
    });

    it('managed window does not use local activeZIndex on drag', () => {
      const context = createMockContext({
        windows: { 'win-1': { id: 'win-1', minimized: false, maximized: false, isSnapped: false, zIndex: 5 } },
        activeWindowId: 'win-1',
      });
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText('Test').closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();
      const windowEl = container.querySelector('.window') as HTMLElement;
      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
      });
      expect(windowEl.style.zIndex).toBe('5');
    });

    it('reports geometry to the manager when position or size changes', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" width={320} height={240} initialX={16} initialY={24} />
        </WindowManagerContext.Provider>
      );

      await waitFor(() => {
        expect(context.updateGeometry).toHaveBeenCalledWith('win-1', {
          x: 16,
          y: 24,
          width: 320,
          height: 240,
        });
      });
    });

    it('reports viewport geometry to the manager when maximized', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext();
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" width={320} height={240} initialX={16} initialY={24} maximized />
        </WindowManagerContext.Provider>,
      );

      await waitFor(() => {
        expect(context.updateGeometry).toHaveBeenCalledWith('win-1', {
          x: 0,
          y: 0,
          width: 1024,
          height: 768,
        });
      });
    });

    it('applies move requests from the manager and clears them', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext({ moveRequests: { 'win-1': { x: 120, y: 80 } } });
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" width={320} height={240} initialX={16} initialY={24} />
        </WindowManagerContext.Provider>
      );
      const windowEl = container.querySelector('.window') as HTMLElement;

      await waitFor(() => {
        expect(windowEl.style.left).toBe('120px');
        expect(windowEl.style.top).toBe('80px');
        expect(context.clearMoveRequest).toHaveBeenCalledWith('win-1');
      });
    });

    it('clamps move requests from the manager to the viewport', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });
      const context = createMockContext({ moveRequests: { 'win-1': { x: 999, y: -10 } } });
      const { container } = render(
        <WindowManagerContext.Provider value={context}>
          <Window title="Test" windowId="win-1" width={320} height={240} initialX={16} initialY={24} />
        </WindowManagerContext.Provider>,
      );
      const windowEl = container.querySelector('.window') as HTMLElement;

      await waitFor(() => {
        expect(windowEl.style.left).toBe('180px');
        expect(windowEl.style.top).toBe('0px');
        expect(context.clearMoveRequest).toHaveBeenCalledWith('win-1');
      });
    });

    it('requests colliding managed windows to move when snap commits with autoMoveOnSnap enabled', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext({
        geometries: {
          'win-1': { x: 50, y: 50, width: 400, height: 300 },
          'win-2': { x: 600, y: 20, width: 200, height: 180 },
        },
      });
      const title = 'Snapping Window';
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title={title} windowId="win-1" width={400} height={300} autoMoveOnSnap />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText(title).closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(context.getAllGeometries).toHaveBeenCalled();
        expect(context.requestMove).toHaveBeenCalledWith('win-2', { x: 304, y: 20 });
      });
    });

    it('requests colliding managed windows to move when context autoMoveOnSnap is enabled', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext({
        autoMoveOnSnap: true,
        geometries: {
          'win-1': { x: 50, y: 50, width: 400, height: 300 },
          'win-2': { x: 600, y: 20, width: 200, height: 180 },
        },
      });
      const title = 'Context Snapping Window';
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title={title} windowId="win-1" width={400} height={300} />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText(title).closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(context.getAllGeometries).toHaveBeenCalled();
        expect(context.requestMove).toHaveBeenCalledWith('win-2', { x: 304, y: 20 });
      });
    });

    it('shrinks a lower-z snapped window horizontally when a foreground snap overlaps it', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const spies = createManagerSpies();

      const { container } = render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={400} height={300} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );
      const windows = container.querySelectorAll('.window');
      const background = windows[0] as HTMLElement;
      const foreground = windows[1] as HTMLElement;

      snapWindow('Background A', 10, 384);

      await waitFor(() => {
        expect(background.style.left).toBe('0px');
        expect(background.style.width).toBe('500px');
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 384);

      await waitFor(() => {
        expect(spies.requestResize).toHaveBeenCalledWith('win-a', { x: 0, y: 0, width: 450, height: 768 });
        expect(background.style.width).toBe('450px');
        expect(foreground.style.left).toBe('450px');
        expect(foreground.style.width).toBe('450px');
        expect(spies.requestMove).not.toHaveBeenCalled();
      });
    });

    it('marks windows snapped through the manager and restores shrunk backgrounds when foreground unsnaps', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const spies = createManagerSpies();

      const { container } = render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={400} height={300} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );
      const windows = container.querySelectorAll('.window');
      const background = windows[0] as HTMLElement;
      const foregroundTitleBar = screen.getByText('Foreground B').closest('.title-bar') as HTMLElement;
      foregroundTitleBar.setPointerCapture = vi.fn();
      foregroundTitleBar.releasePointerCapture = vi.fn();

      snapWindow('Background A', 10, 384);

      await waitFor(() => {
        expect(spies.setWindowSnapped).toHaveBeenCalledWith('win-a', true);
        expect(background.style.width).toBe('500px');
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 384);

      await waitFor(() => {
        expect(spies.setWindowSnapped).toHaveBeenCalledWith('win-b', true);
        expect(background.style.width).toBe('450px');
      });

      act(() => {
        foregroundTitleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 460, clientY: 100, pointerId: 2, bubbles: true }),
        );
      });

      await waitFor(() => {
        expect(spies.setWindowSnapped).toHaveBeenCalledWith('win-b', false);
        expect(spies.restoreShrink).toHaveBeenCalledWith('win-a');
        expect(background.style.width).toBe('500px');
      });
    });

    it('shrinks a lower-z snapped window vertically when a foreground snap overlaps it', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      const spies = createManagerSpies();

      const { container } = render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={400} height={300} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );
      const windows = container.querySelectorAll('.window');
      const background = windows[0] as HTMLElement;
      const foreground = windows[1] as HTMLElement;

      snapWindow('Background A', 500, 10);

      await waitFor(() => {
        expect(background.style.top).toBe('0px');
        expect(background.style.height).toBe('400px');
      });

      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      snapWindow('Foreground B', 500, 690);

      await waitFor(() => {
        expect(spies.requestResize).toHaveBeenCalledWith('win-a', { x: 0, y: 0, width: 1000, height: 350 });
        expect(background.style.height).toBe('350px');
        expect(foreground.style.top).toBe('350px');
        expect(foreground.style.height).toBe('350px');
        expect(spies.requestMove).not.toHaveBeenCalled();
      });
    });

    it('shrinks a left-snapped background below a top-snapped foreground instead of moving it', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={400} height={300} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );
      const background = screen.getByText('Background A').closest('.window') as HTMLElement;

      snapWindow('Background A', 10, 384);

      await waitFor(() => {
        expect(background).toHaveStyle({ left: '0px', top: '0px', width: '512px', height: '768px' });
      });

      snapWindow('Foreground B', 512, 10);

      await waitFor(() => {
        expect(spies.requestResize).toHaveBeenCalledWith('win-a', { x: 0, y: 384, width: 512, height: 384 });
        expect(background).toHaveStyle({ left: '0px', top: '384px', width: '512px', height: '384px' });
        expect(screen.getByText('Foreground B').closest('.window')).toHaveStyle({ left: '0px', top: '0px', width: '1024px', height: '384px' });
        expect(spies.requestMove).not.toHaveBeenCalled();
      });
    });

    it('falls back to moving a lower-z background window when it is not snapped', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={100} height={100} initialX={500} initialY={0} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ left: '500px' });
      });

      snapWindow('Foreground B', 1014, 384);

      await waitFor(() => {
        expect(spies.requestResize).not.toHaveBeenCalled();
        expect(spies.requestMove).toHaveBeenCalledWith('win-a', { x: 404, y: 8 });
      });
    });

    it('does not shrink or move overlapping windows when autoMoveOnSnap is false', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const spies = createManagerSpies();

      const { container } = render(
        <StatefulWindowManager windows={managedWindows} spies={spies}>
          <Window title="Background A" windowId="win-a" width={400} height={300} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} autoMoveOnSnap={false} />
        </StatefulWindowManager>,
      );
      const background = container.querySelector('.window') as HTMLElement;

      snapWindow('Background A', 10, 384);

      await waitFor(() => {
        expect(background.style.width).toBe('500px');
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 384);

      await waitFor(() => {
        expect(spies.requestResize).not.toHaveBeenCalled();
        expect(spies.requestMove).not.toHaveBeenCalled();
        expect(background.style.width).toBe('500px');
      });
    });

    it('does not request collision moves on snap commit by default', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      const context = createMockContext({
        geometries: {
          'win-1': { x: 50, y: 50, width: 400, height: 300 },
          'win-2': { x: 600, y: 20, width: 200, height: 180 },
        },
      });
      const title = 'Snapping Window';
      render(
        <WindowManagerContext.Provider value={context}>
          <Window title={title} windowId="win-1" width={400} height={300} />
        </WindowManagerContext.Provider>
      );
      const titleBar = screen.getByText(title).closest('.title-bar') as HTMLElement;
      titleBar.setPointerCapture = vi.fn();
      titleBar.releasePointerCapture = vi.fn();

      act(() => {
        titleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }),
        );
        window.dispatchEvent(createPointerEvent('pointermove', { clientX: 1014, clientY: 384, pointerId: 1 }));
        window.dispatchEvent(createPointerEvent('pointerup', { clientX: 1014, clientY: 384, pointerId: 1 }));
      });

      await waitFor(() => {
        expect(context.requestMove).not.toHaveBeenCalled();
      });
    });

    it('restores a shrunken background window when the snapped foreground window starts dragging away', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={600} height={500} initialX={8} initialY={8} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );

      snapWindow('Background A', 10, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ left: '0px', width: '500px' });
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ width: '450px' });
      });

      const foregroundTitleBar = screen.getByText('Foreground B').closest('.title-bar') as HTMLElement;
      foregroundTitleBar.setPointerCapture = vi.fn();
      foregroundTitleBar.releasePointerCapture = vi.fn();

      act(() => {
        foregroundTitleBar.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 700, clientY: 100, pointerId: 2, bubbles: true }),
        );
      });

      await waitFor(() => {
        expect(spies.restoreShrink).toHaveBeenCalledWith('win-a');
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ width: '500px' });
      });
    });

    it('restores a shrunken background window when its resize handle is pressed', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={600} height={500} initialX={8} initialY={8} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );

      snapWindow('Background A', 10, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ left: '0px', width: '500px' });
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ width: '450px' });
      });

      const backgroundWindow = screen.getByText('Background A').closest('.window') as HTMLElement;
      // 見えるグリップはステータスバーがある窓にしか出ないので、不可視の se ハンドルで押す。
      const resizeGrip = backgroundWindow.querySelector(
        `.${styles.resizeHandle}.${styles.se}`,
      ) as HTMLElement;
      resizeGrip.setPointerCapture = vi.fn();
      resizeGrip.releasePointerCapture = vi.fn();

      act(() => {
        resizeGrip.dispatchEvent(
          createPointerEvent('pointerdown', { clientX: 500, clientY: 499, pointerId: 3, bubbles: true }),
        );
      });

      await waitFor(() => {
        expect(spies.restoreShrink).toHaveBeenCalledWith('win-a');
        expect(backgroundWindow).toHaveStyle({ width: '500px' });
      });
    });

    it('does not shrink a lower-z window twice for repeated snap commits with the same overlap', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager windows={managedWindows} autoMoveOnSnap spies={spies}>
          <Window title="Background A" windowId="win-a" width={600} height={500} initialX={8} initialY={8} />
          <Window title="Foreground B" windowId="win-b" width={400} height={300} />
        </StatefulWindowManager>,
      );

      snapWindow('Background A', 10, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ left: '0px', width: '500px' });
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Foreground B', 890, 350);

      await waitFor(() => {
        expect(spies.requestResize.mock.calls[0]?.[1]).toEqual({ x: 0, y: 0, width: 450, height: 700 });
      });

      snapWindow('Foreground B', 890, 350);

      await waitFor(() => {
        expect(spies.requestResize).toHaveBeenCalledTimes(2);
        expect(spies.requestResize.mock.calls[1]?.[1]).toEqual({ x: 0, y: 0, width: 450, height: 700 });
      });
    });

    it('processes three snapped windows top-to-bottom without shrinking the lowest window twice', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      const spies = createManagerSpies();

      render(
        <StatefulWindowManager
          windows={{
            'win-a': { id: 'win-a', minimized: false, maximized: false, isSnapped: false, zIndex: 1 },
            'win-b': { id: 'win-b', minimized: false, maximized: false, isSnapped: false, zIndex: 2 },
            'win-c': { id: 'win-c', minimized: false, maximized: false, isSnapped: false, zIndex: 3 },
          }}
          autoMoveOnSnap
          spies={spies}
        >
          <Window title="Background A" windowId="win-a" width={600} height={500} initialX={8} initialY={8} />
          <Window title="Middle B" windowId="win-b" width={400} height={300} />
          <Window title="Foreground C" windowId="win-c" width={400} height={300} />
        </StatefulWindowManager>,
      );

      snapWindow('Background A', 10, 350);

      await waitFor(() => {
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ left: '0px', width: '500px' });
      });

      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      snapWindow('Middle B', 890, 350);

      await waitFor(() => {
        expect(spies.requestResize.mock.calls[0]?.[1]).toEqual({ x: 0, y: 0, width: 450, height: 700 });
      });

      snapWindow('Foreground C', 890, 350);

      await waitFor(() => {
        expect(spies.requestResize).toHaveBeenCalledTimes(2);
        expect(spies.requestResize.mock.calls[1]?.[1]).toEqual({ x: 0, y: 0, width: 450, height: 700 });
        expect(screen.getByText('Background A').closest('.window')).toHaveStyle({ width: '450px' });
      });
    });
  });
