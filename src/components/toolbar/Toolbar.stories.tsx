import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './Toolbar';
import type { ToolbarItemDef } from './Toolbar';
import { ICONS } from '../../icons/icons';

const meta: Meta<typeof Toolbar> = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

const fileExplorerItems: ToolbarItemDef[] = [
  {
    type: 'button',
    id: 'back',
    icon: ICONS.back,
    label: 'Back',
    tooltip: 'Back',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'forward',
    label: 'Forward',
    tooltip: 'Forward',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'up',
    icon: ICONS.up,
    label: 'Up',
    tooltip: 'Up One Level',
    onClick: () => {},
  },
  { type: 'separator' },
  {
    type: 'button',
    id: 'cut',
    label: 'Cut',
    tooltip: 'Cut',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'copy',
    label: 'Copy',
    tooltip: 'Copy',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'paste',
    label: 'Paste',
    tooltip: 'Paste',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'undo',
    label: 'Undo',
    tooltip: 'Undo',
    disabled: true,
    onClick: () => {},
  },
  { type: 'separator' },
  {
    type: 'button',
    id: 'delete',
    label: 'Delete',
    tooltip: 'Delete',
    onClick: () => {},
  },
  {
    type: 'button',
    id: 'properties',
    label: 'Properties',
    tooltip: 'Properties',
    onClick: () => {},
  },
  { type: 'separator' },
  {
    type: 'dropdown',
    id: 'views',
    label: 'Views',
    tooltip: 'Views',
    items: [
      { label: 'Thumbnails', onClick: () => {} },
      { label: 'Tiles', onClick: () => {} },
      { label: 'Icons', onClick: () => {} },
      { label: 'List', onClick: () => {} },
      { label: 'Details', onClick: () => {} },
    ],
  },
];

export const FileExplorerStandard: Story = {
  args: {
    items: fileExplorerItems,
  },
  render: (args) => (
    <div className="window" style={{ width: 640 }}>
      <Toolbar {...args} />
    </div>
  ),
};

export const IconsOnly: Story = {
  args: {
    items: [
      {
        type: 'button',
        id: 'back',
        icon: ICONS.back,
        tooltip: 'Back',
        onClick: () => {},
      },
      {
        type: 'button',
        id: 'forward',
        icon: ICONS.forward,
        tooltip: 'Forward',
        onClick: () => {},
      },
      { type: 'separator' },
      {
        type: 'button',
        id: 'up',
        icon: ICONS.up,
        tooltip: 'Up One Level',
        onClick: () => {},
      },
    ],
  },
  render: (args) => (
    <div className="window" style={{ width: 300 }}>
      <Toolbar {...args} />
    </div>
  ),
};
