import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole('button', { name: 'Click me' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not apply default class when variant is standard', () => {
    render(<Button variant="standard">Standard</Button>);

    expect(screen.getByRole('button', { name: 'Standard' })).not.toHaveClass('default');
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Disabled' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
