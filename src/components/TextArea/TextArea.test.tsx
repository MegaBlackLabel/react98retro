import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders with minimal props', () => {
    render(<TextArea id="ta1" label="Notes" />);

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('applies stacked layout by default', () => {
    const { container } = render(<TextArea id="ta2" label="Notes" />);

    expect(container.firstChild).toHaveClass('field-row-stacked');
  });

  it('forwards additional props', () => {
    render(<TextArea id="ta3" label="Notes" disabled data-testid="textarea" />);

    expect(screen.getByTestId('textarea')).toBeDisabled();
  });

  it('fires onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextArea id="ta4" label="Notes" onChange={onChange} />);

    await user.type(screen.getByLabelText('Notes'), 'Hello');

    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('respects controlled value after rerender', () => {
    const { rerender } = render(<TextArea id="ta5" label="Notes" value="initial" readOnly />);

    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial');

    rerender(<TextArea id="ta5" label="Notes" value="updated" readOnly />);
    expect(textarea.value).toBe('updated');
  });

  it('accepts placeholder prop', () => {
    render(<TextArea id="ta6" label="Notes" placeholder="Enter notes" />);

    expect(screen.getByPlaceholderText('Enter notes')).toBeInTheDocument();
  });

  it('accepts readOnly prop', () => {
    render(<TextArea id="ta7" label="Notes" readOnly />);

    expect(screen.getByLabelText('Notes')).toHaveAttribute('readonly');
  });

  it('accepts rows and cols props', () => {
    render(<TextArea id="ta8" label="Notes" rows={5} cols={40} />);

    const textarea = screen.getByLabelText('Notes');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '40');
  });
});
