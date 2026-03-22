import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
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
});
