import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  it('has aria-label from tooltip', () => {
    render(
      <SplitButton
        icon="icon.png"
        tooltip="表示"
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '表示 メニューを開く');
    expect(button).toHaveAttribute('title', '表示');
  });

  it('has aria-label from label when tooltip is absent', () => {
    render(
      <SplitButton
        icon="icon.png"
        label="表示"
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '表示 メニューを開く');
    expect(button).toHaveAttribute('title', '表示');
  });

  it('has default aria-label when no label or tooltip', () => {
    render(
      <SplitButton
        icon="icon.png"
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'メニューを開く');
  });

  it('toggles menu open on click', () => {
    render(
      <SplitButton
        icon="icon.png"
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not open menu when disabled', () => {
    render(
      <SplitButton
        icon="icon.png"
        disabled
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu when item is clicked', () => {
    const onClick = vi.fn();

    render(
      <SplitButton
        icon="icon.png"
        items={[{ label: 'Item', onClick }]}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Item'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu on outside click', () => {
    render(
      <SplitButton
        icon="icon.png"
        items={[{ label: 'Item' }]}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SplitButton
        icon="icon.png"
        className="my-split"
        items={[{ label: 'Item' }]}
      />,
    );

    expect(container.firstChild).toHaveClass('my-split');
  });
});
