import type { Meta, StoryObj } from '@storybook/react-vite';
import { Window } from './Window';
import { StatusBar, StatusBarField } from './StatusBar';

const meta: Meta<typeof Window> = {
  title: 'Window/Window',
  component: Window,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Documented snap zones: left, right, top, bottom, top-left, top-right, bottom-left, and bottom-right. Snap Assist, Snap Groups, and keyboard shortcuts are not included.',
      },
    },
  },
  argTypes: {
    snapEnabled: {
      control: 'boolean',
    },
    snapThreshold: {
      control: { type: 'number', min: 0, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Window>;
type WindowProps = React.ComponentProps<typeof Window>;

const windowArgs = {
  onMinimize: () => {},
  onMaximize: () => {},
  onClose: () => {},
  snapEnabled: true,
  snapThreshold: 20,
};

const renderWindow = (args: Story['args']) => {
  const windowProps = args as WindowProps;

  return (
    <Window {...windowProps}>
      <p>This is the window body content.</p>
      <p>Windows 98 style window!</p>
    </Window>
  );
};

export const Default: Story = {
  args: {
    ...windowArgs,
    title: 'My Documents',
    width: 480,
    height: 320,
    initialX: 40,
    initialY: 40,
  },
  render: renderWindow,
};

export const SnapPlayground: Story = {
  args: {
    ...windowArgs,
    title: 'Snap Playground',
    width: 480,
    height: 320,
    initialX: 40,
    initialY: 40,
  },
  render: renderWindow,
};

export const Inactive: Story = {
  args: {
    ...windowArgs,
    title: 'Inactive Window',
    inactive: true,
    width: 400,
    height: 280,
    initialX: 80,
    initialY: 80,
  },
  render: (args) => (
    <Window {...args}>
      <p>This window is inactive (unfocused).</p>
    </Window>
  ),
};

export const Maximized: Story = {
  args: {
    ...windowArgs,
    title: 'Maximized Window',
    maximized: true,
    onRestore: () => {},
  },
  render: (args) => (
    <Window {...args}>
      <p>This window fills the entire viewport.</p>
    </Window>
  ),
};

export const MaximizedFixed: Story = {
  args: {
    ...windowArgs,
    title: 'Maximized (Fixed)',
    maximized: true,
    restorable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '最大化したまま固定する (maximized restorable={false})。復元ボタンは非活性で、タイトルバーのダブルクリックやドラッグでも最大化のまま。',
      },
    },
  },
  render: (args) => (
    <Window {...args}>
      <p>このウィンドウは最大化のまま固定され、元のサイズに戻せません。</p>
    </Window>
  ),
};

export const Minimized: Story = {
  args: {
    ...windowArgs,
    title: 'Minimized Window',
    minimized: true,
    width: 400,
    height: 280,
    initialX: 80,
    initialY: 80,
  },
  render: (args) => (
    <Window {...args}>
      <p>This window is minimized (only title bar visible at bottom-left).</p>
    </Window>
  ),
};

export const CloseOnly: Story = {
  args: {
    ...windowArgs,
    title: 'Close Only',
    minimizable: false,
    maximizable: false,
    width: 400,
    height: 240,
    initialX: 80,
    initialY: 80,
  },
  parameters: {
    docs: {
      description: {
        story: '閉じるボタンだけを表示する (minimizable={false} maximizable={false})。',
      },
    },
  },
  render: (args) => (
    <Window {...args}>
      <p>タイトルバーには閉じるボタンだけが残ります。</p>
    </Window>
  ),
};

export const MaximizeDisabled: Story = {
  args: {
    ...windowArgs,
    title: 'Maximize Disabled',
    maximizeDisabled: true,
    width: 400,
    height: 240,
    initialX: 80,
    initialY: 80,
  },
  parameters: {
    docs: {
      description: {
        story: '最大化ボタンがグレー表示で押せない (maximizeDisabled)。',
      },
    },
  },
  render: (args) => (
    <Window {...args}>
      <p>最大化ボタンは非活性、最小化と閉じるは押せます。</p>
    </Window>
  ),
};

export const MinimizeHidden: Story = {
  args: {
    ...windowArgs,
    title: 'Minimize Hidden',
    minimizable: false,
    width: 400,
    height: 240,
    initialX: 80,
    initialY: 80,
  },
  parameters: {
    docs: {
      description: {
        story: '最小化ボタンを表示しない (minimizable={false})。',
      },
    },
  },
  render: (args) => (
    <Window {...args}>
      <p>タイトルバーに最小化ボタンはありません。</p>
    </Window>
  ),
};

export const NotResizable: Story = {
  args: {
    ...windowArgs,
    title: 'Fixed Size Window',
    resizable: false,
    width: 400,
    height: 240,
    initialX: 80,
    initialY: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          '固定サイズのウィンドウ (resizable={false})。8 方向のリサイズ ハンドルを描かないので、端をつかんでもサイズは変わりません。',
      },
    },
  },
  render: (args) => (
    <Window {...args}>
      <p>このウィンドウはサイズ変更できません (リサイズ ハンドルなし)。</p>
    </Window>
  ),
};

export const WithStatusBar: Story = {
  args: {
    ...windowArgs,
    title: 'My Computer',
    width: 560,
    height: 380,
    initialX: 60,
    initialY: 60,
  },
  render: (args) => (
    <Window
      {...args}
      statusBar={
        <StatusBar>
          <StatusBarField>12 object(s)</StatusBarField>
          <StatusBarField>1.20 MB</StatusBarField>
        </StatusBar>
      }
    >
      <p>Window with a status bar at the bottom.</p>
    </Window>
  ),
};

export const MultipleSnappingWindows: Story = {
  args: {
    ...windowArgs,
    title: 'Primary Window',
    width: 420,
    height: 280,
    initialX: 32,
    initialY: 48,
  },
  render: (args) => (
    <>
      <Window {...args} title="Primary Window" initialX={32} initialY={48}>
        <p>Drag me to any edge or corner to snap independently.</p>
      </Window>
      <Window
        {...args}
        title="Secondary Window"
        width={360}
        height={240}
        initialX={240}
        initialY={160}
      >
        <p>This second window snaps on its own too.</p>
      </Window>
    </>
  ),
};

export const SnapDisabled: Story = {
  args: {
    ...windowArgs,
    title: 'Snap Disabled',
    snapEnabled: false,
    width: 440,
    height: 300,
    initialX: 72,
    initialY: 72,
  },
  render: (args) => (
    <Window {...args}>
      <p>Snapping is turned off for this window.</p>
    </Window>
  ),
};

export const CustomSnapThreshold: Story = {
  args: {
    ...windowArgs,
    title: 'Custom Threshold',
    snapThreshold: 40,
    width: 440,
    height: 300,
    initialX: 72,
    initialY: 72,
  },
  render: (args) => (
    <Window {...args}>
      <p>This window uses a wider snap threshold.</p>
    </Window>
  ),
};

export const SnapOverlapShrink: Story = {
  args: {
    ...windowArgs,
    title: 'Background A',
    width: 1280,
    height: 384,
    initialX: 0,
    initialY: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two managed windows with autoMoveOnSnap enabled. Drag Background A to the top edge to snap it to the top half, then drag Foreground B to the right edge. The foreground snap overlaps the snapped background, triggering horizontal shrink so the intersection area becomes zero.',
      },
    },
  },
  render: (args) => (
    <>
      <Window
        {...args}
        title="Background A"
        windowId="win-a"
        width={1280}
        height={384}
        initialX={0}
        initialY={0}
      >
        <p>Snap me to the top edge first.</p>
      </Window>
      <Window
        {...args}
        title="Foreground B"
        windowId="win-b"
        width={400}
        height={300}
        initialX={300}
        initialY={300}
      >
        <p>Then drag me to the right edge to shrink the background.</p>
      </Window>
    </>
  ),
};
