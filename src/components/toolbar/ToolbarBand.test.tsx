import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToolbarBand } from './ToolbarBand';

function rows(count: number) {
  return Array.from({ length: count }, (_, i) => <div key={i} data-testid={`row-${i}`} />);
}

describe('ToolbarBand', () => {
  it('renders a single row without a groove', () => {
    render(<ToolbarBand rows={rows(1)} />);

    expect(screen.getByTestId('row-0')).toBeInTheDocument();
    expect(screen.queryAllByRole('separator')).toHaveLength(0);
  });

  it('puts a groove between wrapped rows', () => {
    render(<ToolbarBand rows={rows(3)} />);

    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });

  it('keeps rows and grooves in order', () => {
    render(<ToolbarBand rows={rows(3)} data-testid="band" />);

    const order = Array.from(screen.getByTestId('band').children).map(
      (child) => child.getAttribute('data-testid') ?? 'groove',
    );
    expect(order).toEqual(['row-0', 'groove', 'row-1', 'groove', 'row-2']);
  });

  it('forwards arbitrary DOM props', () => {
    render(<ToolbarBand rows={rows(1)} data-testid="band" className="extra" />);

    expect(screen.getByTestId('band').className).toContain('extra');
  });

  it('forwards a ref to the band element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ToolbarBand rows={rows(1)} ref={ref} data-testid="band" />);

    expect(ref.current).toBe(screen.getByTestId('band'));
  });
});
