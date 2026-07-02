import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('calls onChange when selecting an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Dropdown
        aria-label="Rating"
        onChange={onChange}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rating' }), 'b');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('respects controlled value', () => {
    render(
      <Dropdown
        aria-label="Rating"
        value="b"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Rating' }) as HTMLSelectElement;
    expect(select.value).toBe('b');
  });

  it('renders children instead of options', () => {
    render(
      <Dropdown aria-label="Rating">
        <option value="x">X</option>
        <option value="y">Y</option>
      </Dropdown>,
    );

    expect(screen.getByRole('option', { name: 'X' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Y' })).toBeInTheDocument();
  });

  it('does not crash with empty options', () => {
    render(<Dropdown aria-label="Rating" options={[]} />);

    expect(screen.getByRole('combobox', { name: 'Rating' })).toBeInTheDocument();
  });
});
