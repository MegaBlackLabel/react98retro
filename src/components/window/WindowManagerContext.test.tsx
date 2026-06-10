import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { Win98Provider } from '../Win98Provider';
import { WindowManagerContext, useWindowManagerContext } from './WindowManagerContext';

import { Window } from './Window';
import { act } from '@testing-library/react';

// Test component that consumes the context
function ContextConsumer() {
  const manager = useWindowManagerContext();
  return (
    <div data-testid="consumer">
      {manager === null ? 'no-manager' : 'has-manager'}
      {manager && (
        <>
          <span data-testid="windows-count">{Object.keys(manager.windows).length}</span>
          <span data-testid="active-window">{manager.activeWindowId ?? 'none'}</span>
          <button data-testid="register-btn" onClick={() => manager.register('win1')}>
            Register
          </button>
          <button data-testid="focus-btn" onClick={() => manager.focus('win1')}>
            Focus
          </button>
        </>
      )}
    </div>
  );
}

describe('WindowManagerContext', () => {
  it('returns null when used outside Win98Provider', () => {
    render(<ContextConsumer />);
    expect(screen.getByTestId('consumer')).toHaveTextContent('no-manager');
  });

  it('returns a manager when inside Win98Provider', () => {
    render(
      <Win98Provider>
        <ContextConsumer />
      </Win98Provider>,
    );
    expect(screen.getByTestId('consumer')).toHaveTextContent('has-manager');
  });

  it('provides window manager with expected API', () => {
    render(
      <Win98Provider>
        <ContextConsumer />
      </Win98Provider>,
    );

    const manager = screen.getByTestId('consumer');
    expect(manager).toHaveTextContent('has-manager');
    expect(screen.getByTestId('windows-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-window')).toHaveTextContent('none');
  });

  it('register and focus update the manager state', async () => {
    const user = userEvent.setup();
    render(
      <Win98Provider>
        <ContextConsumer />
      </Win98Provider>,
    );

    // Initially no windows
    expect(screen.getByTestId('windows-count')).toHaveTextContent('0');

    // Register a window
    await user.click(screen.getByTestId('register-btn'));
    expect(screen.getByTestId('windows-count')).toHaveTextContent('1');

    // Focus the window
    await user.click(screen.getByTestId('focus-btn'));
    expect(screen.getByTestId('active-window')).toHaveTextContent('win1');
  });

  it('exports WindowManagerContext directly for advanced use cases', () => {
    // The context itself should be exported so consumers can use it directly
    expect(WindowManagerContext).toBeDefined();
    expect(WindowManagerContext.displayName).toBe('WindowManagerContext');
  });

  it('only one window active at a time with real useWindowManager + Win98Provider', async () => {
    const { container } = render(
      <Win98Provider>
        <Window title="Window 1" id="win-1" />
        <Window title="Window 2" id="win-2" />
      </Win98Provider>,
    );

    const windowEls = container.querySelectorAll('.window');
    expect(windowEls).toHaveLength(2);

    const titleBar1 = screen.getByText('Window 1').closest('.title-bar') as HTMLElement;
    const titleBar2 = screen.getByText('Window 2').closest('.title-bar') as HTMLElement;

    // First window should be active (auto-focused on register), second inactive
    expect(titleBar1).not.toHaveClass('inactive');
    expect(titleBar2).toHaveClass('inactive');

    // Click second window to focus it
    act(() => {
      windowEls[1].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    });

    // Now first should be inactive, second active
    expect(titleBar1).toHaveClass('inactive');
    expect(titleBar2).not.toHaveClass('inactive');
  });

  it('Win98Provider provides WindowManagerContext that is not null', () => {
    function ContextChecker() {
      const manager = useWindowManagerContext();
      return (
        <div data-testid="context-checker">
          {manager === null ? 'null' : 'not-null'}
        </div>
      );
    }

    render(
      <Win98Provider>
        <ContextChecker />
      </Win98Provider>,
    );

    expect(screen.getByTestId('context-checker')).toHaveTextContent('not-null');
  });
});
