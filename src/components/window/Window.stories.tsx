import type { Meta, StoryObj } from '@storybook/react-vite';
import { Window } from './Window';
import { StatusBar, StatusBarField } from './StatusBar';

const meta: Meta<typeof Window> = {
  title: 'Window/Window',
  component: Window,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Window>;

export const Default: Story = {
  args: {
    title: 'My Documents',
    width: 480,
    height: 320,
    initialX: 40,
    initialY: 40,
    onMinimize: () => {},
    onMaximize: () => {},
    onClose: () => {},
  },
  render: (args) => (
    <Window {...args}>
      <p>This is the window body content.</p>
      <p>Windows 98 style window!</p>
    </Window>
  ),
};

export const Inactive: Story = {
  args: {
    title: 'Inactive Window',
    inactive: true,
    width: 400,
    height: 280,
    initialX: 80,
    initialY: 80,
    onMinimize: () => {},
    onMaximize: () => {},
    onClose: () => {},
  },
  render: (args) => (
    <Window {...args}>
      <p>This window is inactive (unfocused).</p>
    </Window>
  ),
};

export const Maximized: Story = {
  args: {
    title: 'Maximized Window',
    maximized: true,
    onMinimize: () => {},
    onRestore: () => {},
    onClose: () => {},
  },
  render: (args) => (
    <Window {...args}>
      <p>This window fills the entire viewport.</p>
    </Window>
  ),
};

export const Minimized: Story = {
  args: {
    title: 'Minimized Window',
    minimized: true,
    width: 400,
    height: 280,
    initialX: 80,
    initialY: 80,
    onMinimize: () => {},
    onMaximize: () => {},
    onClose: () => {},
  },
  render: (args) => (
    <Window {...args}>
      <p>This window is minimized (only title bar visible at bottom-left).</p>
    </Window>
  ),
};

export const WithStatusBar: Story = {
  args: {
    title: 'My Computer',
    width: 560,
    height: 380,
    initialX: 60,
    initialY: 60,
    onMinimize: () => {},
    onMaximize: () => {},
    onClose: () => {},
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
