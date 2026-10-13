import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Groove } from './Groove';

describe('Groove', () => {
  it('renders a horizontal separator by default', () => {
    render(<Groove data-testid="groove" />);

    const groove = screen.getByTestId('groove');
    expect(groove).toHaveAttribute('role', 'separator');
    expect(groove).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders a vertical separator when orientation is vertical', () => {
    render(<Groove orientation="vertical" data-testid="groove" />);

    expect(screen.getByTestId('groove')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards arbitrary DOM props', () => {
    render(<Groove data-testid="groove" className="extra" style={{ marginTop: 2 }} />);

    const groove = screen.getByTestId('groove');
    expect(groove.className).toContain('extra');
    expect(groove.style.marginTop).toBe('2px');
  });
});
