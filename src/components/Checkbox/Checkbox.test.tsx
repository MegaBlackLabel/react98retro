import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders with minimal props', () => {
    render(<Checkbox id="cb1" label="Check me" />);

    expect(screen.getByLabelText('Check me')).toBeInTheDocument();
  });

  it('associates label with id', () => {
    render(<Checkbox id="cb2" label="Associated" />);

    expect(screen.getByLabelText('Associated')).toHaveAttribute('id', 'cb2');
    expect(screen.getByText('Associated')).toHaveAttribute('for', 'cb2');
  });

  it('forwards additional props', () => {
    render(<Checkbox id="cb3" label="Disabled" disabled data-testid="checkbox" />);

    expect(screen.getByTestId('checkbox')).toBeDisabled();
  });
});
