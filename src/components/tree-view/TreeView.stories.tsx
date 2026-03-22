import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeView } from './TreeView';

const meta = {
  title: 'Components/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  args: {
    items: [
      { id: 'desktop', label: 'Desktop' },
      {
        id: 'computer',
        label: 'My Computer',
        defaultOpen: true,
        children: [
          { id: 'c-drive', label: 'Local Disk (C:)' },
          { id: 'd-drive', label: 'Local Disk (D:)' },
        ],
      },
    ],
  },
} satisfies Meta<typeof TreeView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicTree: Story = {};

export const FileSystemStructure: Story = {
  args: {
    items: [
      {
        id: 'c',
        label: 'C:\\',
        defaultOpen: true,
        children: [
          {
            id: 'windows',
            label: 'Windows',
            defaultOpen: true,
            children: [
              { id: 'system32', label: 'System32' },
              { id: 'explorer', label: 'explorer.exe' },
            ],
          },
        ],
      },
    ],
  },
};
