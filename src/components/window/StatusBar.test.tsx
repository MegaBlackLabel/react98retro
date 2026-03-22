import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBar, StatusBarField } from './StatusBar';

describe('StatusBar', () => {
  it('renders status-bar class', () => {
    const { container } = render(<StatusBar />);
    expect(container.firstChild).toHaveClass('status-bar');
  });

  it('renders children', () => {
    render(<StatusBar><span>Ready</span></StatusBar>);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});

describe('StatusBarField', () => {
  it('renders status-bar-field class', () => {
    const { container } = render(<StatusBarField>Items: 3</StatusBarField>);
    expect(container.firstChild).toHaveClass('status-bar-field');
  });

  it('renders children', () => {
    render(<StatusBarField>12 objects</StatusBarField>);
    expect(screen.getByText('12 objects')).toBeInTheDocument();
  });
});
