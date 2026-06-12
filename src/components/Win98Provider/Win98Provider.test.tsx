import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Win98Provider } from './Win98Provider';
import { useWindowManagerContext } from '../window/WindowManagerContext';

describe('Win98Provider', () => {
  it('renders children inside .win98 wrapper', () => {
    const { container } = render(
      <Win98Provider>
        <div data-testid="child">Child</div>
      </Win98Provider>,
    );
    const wrapper = container.querySelector('.win98');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByTestId('child'));
  });

  it('merges custom className', () => {
    const { container } = render(
      <Win98Provider className="custom-theme">
        <div />
      </Win98Provider>,
    );
    const wrapper = container.querySelector('.win98');
    expect(wrapper).toHaveClass('custom-theme');
  });

  it('applies custom style', () => {
    const { container } = render(
      <Win98Provider style={{ background: 'red' }}>
        <div />
      </Win98Provider>,
    );
    const wrapper = container.querySelector('.win98');
    expect(wrapper).toHaveStyle({ background: 'red' });
  });

  it('provides window manager context to children', () => {
    function ContextConsumer() {
      const manager = useWindowManagerContext();
      return (
        <div data-testid="consumer">
          {manager ? 'has-manager' : 'no-manager'}
        </div>
      );
    }

    render(
      <Win98Provider>
        <ContextConsumer />
      </Win98Provider>,
    );

    expect(screen.getByTestId('consumer')).toHaveTextContent('has-manager');
  });

  it('context returns null outside provider', () => {
    function ContextConsumer() {
      const manager = useWindowManagerContext();
      return (
        <div data-testid="consumer">
          {manager ? 'has-manager' : 'no-manager'}
        </div>
      );
    }

    render(<ContextConsumer />);
    expect(screen.getByTestId('consumer')).toHaveTextContent('no-manager');
  });
});
