import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextBox } from './TextBox';

describe('TextBox', () => {
  it('renders with minimal props', () => {
    render(<TextBox id="t1" label="Name" />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('applies stacked layout when requested', () => {
    const { container } = render(<TextBox id="t2" label="Name" stacked />);

    expect(container.firstChild).toHaveClass('field-row-stacked');
  });

  it('forwards additional props', () => {
    render(<TextBox id="t3" label="Name" disabled data-testid="textbox" />);

    expect(screen.getByTestId('textbox')).toBeDisabled();
  });

  it('fires onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextBox id="t4" label="Name" onChange={onChange} />);

    await user.type(screen.getByLabelText('Name'), 'Hello');

    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('respects controlled value after rerender', () => {
    const { rerender } = render(<TextBox id="t5" label="Name" value="initial" readOnly />);

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('initial');

    rerender(<TextBox id="t5" label="Name" value="updated" readOnly />);
    expect(input.value).toBe('updated');
  });

  it('accepts placeholder prop', () => {
    render(<TextBox id="t6" label="Name" placeholder="Enter name" />);

    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('accepts readOnly prop', () => {
    render(<TextBox id="t7" label="Name" readOnly />);

    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
  });
});
