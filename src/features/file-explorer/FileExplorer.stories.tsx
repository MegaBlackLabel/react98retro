import type { Meta, StoryObj } from '@storybook/react';
import { FileExplorer } from './FileExplorer';

const meta: Meta<typeof FileExplorer> = {
  title: 'Features/FileExplorer',
  component: FileExplorer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#008080',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileExplorer>;

export const Default: Story = {
  args: {
    initialX: 20,
    initialY: 20,
    initialWidth: 640,
    initialHeight: 480,
  },
  name: 'マイコンピュータ',
};
