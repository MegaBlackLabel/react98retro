import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders with minimal props', () => {
    render(<Slider aria-label="Volume" />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  it('applies the box indicator class', () => {
    render(<Slider aria-label="Volume" boxIndicator />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveClass(
      'has-box-indicator',
    );
  });

  it('wraps vertically rendered sliders', () => {
    const { container } = render(<Slider aria-label="Volume" vertical />);

    expect(container.firstChild).toHaveClass('is-vertical');
  });
});
