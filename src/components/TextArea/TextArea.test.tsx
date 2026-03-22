import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
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
});
