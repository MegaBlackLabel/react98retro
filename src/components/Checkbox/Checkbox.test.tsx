import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('toggles checked state on click', async () => {
    const user = userEvent.setup();
    render(<Checkbox id="cb4" label="Toggle me" />);

    const checkbox = screen.getByLabelText('Toggle me');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('fires onChange on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox id="cb5" label="Change me" onChange={onChange} />);

    await user.click(screen.getByLabelText('Change me'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('respects controlled checked state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox id="cb6" label="Controlled" checked={false} onChange={onChange} />,
    );

    const checkbox = screen.getByLabelText('Controlled');
    expect(checkbox).not.toBeChecked();

    rerender(
      <Checkbox id="cb6" label="Controlled" checked={true} onChange={onChange} />,
    );
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(onChange).toHaveBeenCalled();
    // controlled stays checked regardless of click
    expect(checkbox).toBeChecked();
  });

  it('applies stacked layout when stacked=true', () => {
    const { container } = render(<Checkbox id="cb7" label="Stacked" stacked />);

    expect(container.firstChild).toHaveClass('field-row-stacked');
  });
});
