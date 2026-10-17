import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
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

  it('defines inactive title-bar styling in raw CSS', async () => {
    const { default: titleBarStyles } = await import('./TitleBar.module.css?raw');
    const rawCss =
      typeof titleBarStyles === 'string'
        ? titleBarStyles
        : await import('node:fs/promises').then(({ readFile }) =>
            readFile(join(process.cwd(), 'src/components/window/TitleBar.module.css'), 'utf8'),
          );

    expect(rawCss).toContain('.titleBar:global(.inactive)');
    expect(rawCss).toContain('linear-gradient(90deg, #808080, #b5b5b5)');
    expect(rawCss).toContain('color: #ffffff');
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

  it('renders the Restore control as a button when maximized', () => {
    render(<TitleBar title="Test" isMaximized={true} onRestore={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Restore' }).tagName).toBe('BUTTON');
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

  describe('button visibility flags', () => {
    it('shows all three controls enabled by default', () => {
      render(<TitleBar title="Test" />);
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
    });

    it('omits the Minimize button when minimizable=false', () => {
      render(<TitleBar title="Test" minimizable={false} />);
      expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('omits the Maximize button when maximizable=false', () => {
      render(<TitleBar title="Test" maximizable={false} />);
      expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('omits the Close button when closable=false', () => {
      render(<TitleBar title="Test" closable={false} />);
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    });

    // 最大化・最小化のスロットは Restore と同居するので、非表示なら Restore ごと消す
    it('omits the maximized Restore control when maximizable=false', () => {
      render(<TitleBar title="Test" maximizable={false} isMaximized onRestore={vi.fn()} />);
      expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    });

    it('omits the minimized Restore control when minimizable=false', () => {
      render(<TitleBar title="Test" minimizable={false} isMinimized />);
      expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    });
  });

  describe('button disabled flags', () => {
    it('disables the Minimize button when minimizeDisabled=true', () => {
      render(<TitleBar title="Test" minimizeDisabled />);
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeDisabled();
    });

    it('disables the Maximize button when maximizeDisabled=true', () => {
      render(<TitleBar title="Test" maximizeDisabled />);
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeDisabled();
    });

    it('disables the Close button when closeDisabled=true', () => {
      render(<TitleBar title="Test" closeDisabled />);
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });

    it('keeps the Maximize button disabled while minimized', () => {
      render(<TitleBar title="Test" isMinimized />);
      expect(screen.getByRole('button', { name: 'Maximize' })).toBeDisabled();
    });

    // Restore はウィンドウを戻す唯一の導線なので、両フラグの影響を受けない
    it('keeps the minimized Restore control enabled even with minimizeDisabled', () => {
      render(<TitleBar title="Test" isMinimized minimizeDisabled />);
      expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled();
    });

    it('disables the Help button when helpDisabled=true', () => {
      render(<TitleBar title="Test" onHelp={vi.fn()} helpDisabled />);
      expect(screen.getByRole('button', { name: 'Help' })).toBeDisabled();
    });

    // 最大化の固定は Window が restorable=false として渡す (最小化からの復元は対象外)
    it('keeps the maximized Restore control enabled by default', () => {
      render(<TitleBar title="Test" isMaximized onRestore={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled();
    });

    it('disables the maximized Restore control when restoreDisabled=true', () => {
      render(<TitleBar title="Test" isMaximized onRestore={vi.fn()} restoreDisabled />);
      expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();
    });

    it('does not disable the minimized Restore control when restoreDisabled=true', () => {
      render(<TitleBar title="Test" isMinimized restoreDisabled />);
      expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled();
    });
  });

  it('does not enlarge title bar buttons on touch devices (no pointer:coarse min-size override)', async () => {
    const { default: titleBarStyles } = await import('./TitleBar.module.css?raw');
    const rawCss =
      typeof titleBarStyles === 'string'
        ? titleBarStyles
        : await import('node:fs/promises').then(({ readFile }) =>
            readFile(join(process.cwd(), 'src/components/window/TitleBar.module.css'), 'utf8'),
          );

    // TitleBar must not contain any pointer:coarse media rule
    // — it would enlarge buttons and make the title bar too thick on mobile.
    const coarseRule = rawCss.match(/@media\s*\(\s*pointer\s*:\s*coarse\s*\)/);
    expect(coarseRule).toBeNull();
  });
});
