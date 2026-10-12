import type { Meta, StoryObj } from '@storybook/react-vite';
import { Taskbar } from './Taskbar';
import type { TaskbarItem } from './Taskbar';

const meta: Meta<typeof Taskbar> = {
  title: 'Components/Taskbar',
  component: Taskbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Taskbar>;

const items: TaskbarItem[] = [
  { id: 'explorer', title: 'エクスプローラ' },
  { id: 'notepad', title: 'メモ帳 - sample.txt', active: true },
  { id: 'minimized', title: 'ペイント', minimized: true },
];

export const Default: Story = {
  args: {
    items,
    showTray: true,
  },
  render: (args) => (
    <div style={{ position: 'fixed', inset: 'auto 0 0 0' }}>
      <Taskbar {...args} />
    </div>
  ),
};

export const Clock: Story = {
  args: {
    items,
    clock: '13:37',
  },
  render: (args) => (
    <div style={{ position: 'fixed', inset: 'auto 0 0 0' }}>
      <Taskbar {...args} />
    </div>
  ),
};
