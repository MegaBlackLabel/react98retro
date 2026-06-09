import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Window } from './Window';
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
      window.dispatchEvent(new Event('resize'));
      
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
      window.dispatchEvent(new Event('resize'));
      
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
