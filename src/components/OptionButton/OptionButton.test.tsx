import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { OptionButton } from './OptionButton';

describe('OptionButton', () => {
  it('renders with minimal props', () => {
    render(<OptionButton id="r1" name="group" label="Option 1" />);

    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
  });

  it('associates label with id', () => {
    render(<OptionButton id="r2" name="group" label="Option 2" />);

    expect(screen.getByLabelText('Option 2')).toHaveAttribute('id', 'r2');
    expect(screen.getByText('Option 2')).toHaveAttribute('for', 'r2');
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
});
