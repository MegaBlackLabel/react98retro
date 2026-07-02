import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
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

  it('fires onInput when value changes', () => {
    const onInput = vi.fn();
    render(<Slider aria-label="Volume" onInput={onInput} min={0} max={100} />);

    const slider = screen.getByRole('slider', { name: 'Volume' });
    fireEvent.input(slider, { target: { value: '50' } });

    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it('accepts min and max props', () => {
    render(<Slider aria-label="Volume" min={10} max={90} />);

    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('accepts value prop', () => {
    render(<Slider aria-label="Volume" min={0} max={100} value={75} readOnly />);

    const slider = screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    expect(slider.value).toBe('75');
  });
});
