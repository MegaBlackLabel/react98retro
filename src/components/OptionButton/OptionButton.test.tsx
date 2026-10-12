import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OptionButton } from './OptionButton';

describe('OptionButton', () => {
  it('renders with minimal props', () => {
    render(<OptionButton id="r1" name="group" label="Option 1" />);

    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
  });

  it('renders an unlabelled radio addressed by aria-label', () => {
    const { container } = render(<OptionButton name="group" aria-label="既定" value="a" />);

    expect(screen.getByRole('radio', { name: '既定' })).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
  });

  it('associates label with id', () => {
    render(<OptionButton id="r2" name="group" label="Option 2" />);

    expect(screen.getByLabelText('Option 2')).toHaveAttribute('id', 'r2');
    expect(screen.getByText('Option 2')).toHaveAttribute('for', 'r2');
  });

  it('keeps the input immediately before the label so 98.css sibling selectors match', () => {
    const { container } = render(<OptionButton id="r-order" name="group" label="Ordered" />);

    const input = screen.getByLabelText('Ordered');
    expect(input.tagName).toBe('INPUT');
    expect(input.nextElementSibling?.tagName).toBe('LABEL');
    expect(container.querySelector('input[type="radio"] + label')).not.toBeNull();
  });

  it('forwards additional props', () => {
    render(
      <OptionButton
        id="r3"
        name="group"
        label="Disabled"
        disabled
        data-testid="radio"
      />,
    );

    expect(screen.getByTestId('radio')).toBeDisabled();
  });

  it('selects radio on click', async () => {
    const user = userEvent.setup();
    render(<OptionButton id="r4" name="group" label="Option A" />);

    const radio = screen.getByLabelText('Option A');
    expect(radio).not.toBeChecked();

    await user.click(radio);
    expect(radio).toBeChecked();
  });

  it('enforces same-name exclusivity', async () => {
    const user = userEvent.setup();
    render(
      <>
        <OptionButton id="r5a" name="exclusive" label="First" />
        <OptionButton id="r5b" name="exclusive" label="Second" />
      </>,
    );

    const first = screen.getByLabelText('First');
    const second = screen.getByLabelText('Second');

    await user.click(first);
    expect(first).toBeChecked();
    expect(second).not.toBeChecked();

    await user.click(second);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
  });

  it('prevents selection when disabled', async () => {
    const user = userEvent.setup();
    render(<OptionButton id="r6" name="group" label="Disabled" disabled />);

    const radio = screen.getByLabelText('Disabled');
    await user.click(radio);

    expect(radio).not.toBeChecked();
  });

  it('fires onChange only for selectable radio', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <OptionButton id="r7a" name="group" label="Enabled" onChange={onChange} />
        <OptionButton id="r7b" name="group" label="Disabled" disabled onChange={onChange} />
      </>,
    );

    await user.click(screen.getByLabelText('Enabled'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
