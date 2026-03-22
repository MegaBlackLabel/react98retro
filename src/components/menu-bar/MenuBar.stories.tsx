import type { Meta, StoryObj } from '@storybook/react-vite';
import { MenuBar } from './MenuBar';
import type { MenuBarMenu } from './MenuBar';

const meta: Meta<typeof MenuBar> = {
  title: 'Components/MenuBar',
  component: MenuBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MenuBar>;

const fileExplorerMenus: MenuBarMenu[] = [
  {
    label: 'File(F)',
    items: [
      {
        type: 'submenu',
        label: 'New',
        items: [
          { type: 'item', label: 'Folder' },
          { type: 'item', label: 'Shortcut' },
          { type: 'separator' },
          { type: 'item', label: 'Text Document' },
          { type: 'item', label: 'Briefcase' },
        ],
      },
      { type: 'item', label: 'Create Shortcut' },
      { type: 'item', label: 'Delete', shortcut: 'Del' },
      { type: 'item', label: 'Rename' },
      { type: 'item', label: 'Properties', shortcut: 'Alt+Enter' },
      { type: 'separator' },
      { type: 'item', label: 'Close', onClick: () => alert('Close clicked') },
    ],
  },
  {
    label: 'Edit(E)',
    items: [
      { type: 'item', label: 'Undo', disabled: true, shortcut: 'Ctrl+Z' },
      { type: 'separator' },
      { type: 'item', label: 'Cut', shortcut: 'Ctrl+X' },
      { type: 'item', label: 'Copy', shortcut: 'Ctrl+C' },
      { type: 'item', label: 'Paste', shortcut: 'Ctrl+V' },
      { type: 'item', label: 'Paste Shortcut' },
      { type: 'separator' },
      { type: 'item', label: 'Copy to Folder...' },
      { type: 'item', label: 'Move to Folder...' },
      { type: 'separator' },
      { type: 'item', label: 'Select All', shortcut: 'Ctrl+A' },
      { type: 'item', label: 'Invert Selection' },
    ],
  },
  {
    label: 'View(V)',
    items: [
      {
        type: 'submenu',
        label: 'Toolbars',
        items: [
          { type: 'item', label: 'Standard Buttons', checked: true },
          { type: 'item', label: 'Address Bar', checked: true },
          { type: 'item', label: 'Links' },
          { type: 'separator' },
          { type: 'item', label: 'Lock the Toolbars' },
          { type: 'item', label: 'Customize...' },
        ],
      },
      { type: 'item', label: 'Status Bar', checked: true },
      {
        type: 'submenu',
        label: 'Explorer Bar',
        items: [
          { type: 'item', label: 'Search', shortcut: 'Ctrl+E' },
          { type: 'item', label: 'Favorites', shortcut: 'Ctrl+I' },
          { type: 'item', label: 'History', shortcut: 'Ctrl+H' },
        ],
      },
      { type: 'separator' },
      { type: 'item', label: 'Thumbnails' },
      { type: 'item', label: 'Tiles' },
      { type: 'item', label: 'Icons' },
      { type: 'item', label: 'List' },
      { type: 'item', label: 'Details', checked: true },
      { type: 'separator' },
      { type: 'item', label: 'Refresh', shortcut: 'F5' },
    ],
  },
  {
    label: 'Favorites(A)',
    items: [
      { type: 'item', label: 'Add to Favorites...' },
      { type: 'separator' },
      { type: 'item', label: 'My Documents' },
      { type: 'item', label: 'My Music' },
      { type: 'item', label: 'My Pictures' },
    ],
  },
  {
    label: 'Tools(T)',
    items: [
      {
        type: 'submenu',
        label: 'Find',
        items: [
          { type: 'item', label: 'Files or Folders...' },
          { type: 'item', label: 'Computer...' },
          { type: 'item', label: 'On the Internet...' },
        ],
      },
      { type: 'item', label: 'Map Network Drive...' },
      { type: 'item', label: 'Disconnect Network Drive...' },
      { type: 'separator' },
      { type: 'item', label: 'Folder Options...' },
    ],
  },
  {
    label: 'Help(H)',
    items: [
      { type: 'item', label: 'Help Topics' },
      { type: 'separator' },
      { type: 'item', label: 'About Windows', onClick: () => alert('Windows 98') },
    ],
  },
];

export const FileExplorer: Story = {
  args: {
    menus: fileExplorerMenus,
  },
  render: (args) => (
    <div className="window" style={{ width: 600 }}>
      <MenuBar {...args} />
    </div>
  ),
};
