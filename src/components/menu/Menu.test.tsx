import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { Menu } from './Menu';

describe('Menu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls onClick and onClose when enabled item is clicked', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();

    render(
      <Menu
        items={[{ label: 'Click me', onClick }]}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick or onClose for disabled item', () => {
    const onClick = vi.fn();
    const onClose = vi.fn();

    render(
      <Menu
        items={[{ label: 'Disabled', onClick, disabled: true }]}
        onClose={onClose}
      />,
    );

    const item = screen.getByText('Disabled').closest('[role="menuitem"]');
    expect(item).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders separator with role="separator"', () => {
    const { container } = render(
      <Menu
        items={[
          { label: 'Item 1' },
          { type: 'separator' },
          { label: 'Item 2' },
        ]}
      />,
    );

    const separators = container.querySelectorAll('[role="separator"]');
    expect(separators.length).toBe(1);
  });

  it('renders checked marker for checked item', () => {
    render(
      <Menu
        items={[{ label: 'Checked', checked: true }]}
      />,
    );

    const item = screen.getByText('Checked').closest('[role="menuitem"]');
    expect(item).toHaveTextContent('✓');
  });

  it('renders unchecked marker without check for unchecked item', () => {
    render(
      <Menu
        items={[{ label: 'Unchecked', checked: false }]}
      />,
    );

    const item = screen.getByText('Unchecked').closest('[role="menuitem"]');
    expect(item).not.toHaveTextContent('✓');
  });

  it('opens submenu on hover', () => {
    render(
      <Menu
        items={[
          {
            label: 'Parent',
            children: [{ label: 'Child' }],
          },
        ]}
      />,
    );

    const parent = screen.getByText('Parent').closest('[role="menuitem"]');
    expect(parent).toHaveAttribute('aria-haspopup', 'menu');
    expect(parent).toHaveAttribute('aria-expanded', 'false');

    fireEvent.mouseEnter(parent!);
    expect(parent).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('closes submenu after 150ms on mouse leave', () => {
    const { container } = render(
      <Menu
        items={[
          {
            label: 'Parent',
            children: [{ label: 'Child' }],
          },
        ]}
      />,
    );

    const parent = screen.getByText('Parent').closest('[role="menuitem"]');
    fireEvent.mouseEnter(parent!);
    expect(screen.getByText('Child')).toBeInTheDocument();

    fireEvent.mouseLeave(parent!);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelectorAll('[role="menu"]').length).toBe(1);
  });

  it('does not close submenu when hovering child menu', () => {
    const { container } = render(
      <Menu
        items={[
          {
            label: 'Parent',
            children: [{ label: 'Child' }],
          },
        ]}
      />,
    );

    const parent = screen.getByText('Parent').closest('[role="menuitem"]');
    fireEvent.mouseEnter(parent!);
    const menus = container.querySelectorAll('[role="menu"]');
    expect(menus.length).toBeGreaterThanOrEqual(1);

    fireEvent.mouseLeave(parent!);
    fireEvent.mouseEnter(menus[menus.length - 1]);
    vi.advanceTimersByTime(200);
    expect(screen.getByText('Child')).toBeInTheDocument();
  });
});
