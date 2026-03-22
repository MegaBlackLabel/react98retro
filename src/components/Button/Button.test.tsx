import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with minimal props', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies the default class for variant="default"', () => {
    render(<Button variant="default">OK</Button>);

    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass('default');
  });

  it('forwards additional props', () => {
    render(
      <Button disabled data-testid="button">
        Disabled
      </Button>,
    );

    expect(screen.getByTestId('button')).toBeDisabled();
  });
});
