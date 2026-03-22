import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TitleBar } from './TitleBar';

describe('TitleBar', () => {
  it('renders title text', () => {
    render(<TitleBar title="My Window" />);
    expect(screen.getByText('My Window')).toBeInTheDocument();
  });

  it('always renders minimize/maximize/close buttons', () => {
    render(<TitleBar title="Test" />);
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('adds inactive class when inactive=true', () => {
    const { container } = render(<TitleBar title="Test" inactive />);
    expect(container.firstChild).toHaveClass('inactive');
  });

  it('always renders minimize button even without onMinimize prop', () => {
    render(<TitleBar title="Test" />);
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
  });

  it('shows Restore button when isMaximized=true', () => {
    render(<TitleBar title="Test" isMaximized={true} onRestore={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
  });

  it('calls onMinimize when Minimize button is clicked', async () => {
    const onMinimize = vi.fn();
    render(<TitleBar title="Test" onMinimize={onMinimize} />);
    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(onMinimize).toHaveBeenCalledOnce();
  });

  it('calls onClose when Close button is clicked', async () => {
    const onClose = vi.fn();
    render(<TitleBar title="Test" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Help button when onHelp provided', () => {
    render(<TitleBar title="Test" onHelp={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  it('renders icon image when icon prop provided', () => {
    const { container } = render(<TitleBar title="Test" icon="/icon.png" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
  });
});
