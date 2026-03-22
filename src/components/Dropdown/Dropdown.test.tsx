import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  it('renders with minimal props', () => {
    render(<Dropdown aria-label="Rating" />);

    expect(screen.getByRole('combobox', { name: 'Rating' })).toBeInTheDocument();
  });

  it('renders options from the options prop', () => {
    render(
      <Dropdown
        aria-label="Rating"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );

    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'B' })).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(
      <Dropdown
        aria-label="Rating"
        disabled
        data-testid="dropdown"
        options={[{ value: 'a', label: 'A' }]}
      />,
    );

    expect(screen.getByTestId('dropdown')).toBeDisabled();
  });
});
