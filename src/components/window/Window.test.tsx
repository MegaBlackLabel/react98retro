import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
});
