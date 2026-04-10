import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Window } from './Window';

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

  it('calls onClose callback', async () => {
    const onClose = vi.fn();
    render(<Window title="Test" onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    closeBtn.click();
    expect(onClose).toHaveBeenCalledOnce();
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
