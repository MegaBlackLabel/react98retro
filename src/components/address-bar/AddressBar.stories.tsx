import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddressBar } from './AddressBar';
import type { AddressBarItem } from './AddressBar';
import { ICONS } from '../../icons/icons';

const meta: Meta<typeof AddressBar> = {
  title: 'Components/AddressBar',
  component: AddressBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AddressBar>;

const sampleHistory: AddressBarItem[] = [
  { path: 'C:\\', label: 'My Computer', icon: ICONS.myComputer },
  { path: 'C:\\Windows', label: 'C:\\Windows', icon: ICONS.folderClosed },
  { path: 'C:\\Program Files', label: 'C:\\Program Files', icon: ICONS.folderClosed },
  { path: 'C:\\My Documents', label: 'My Documents', icon: ICONS.myDocuments },
  { path: 'C:\\WINDOWS\\System32', label: 'C:\\WINDOWS\\System32', icon: ICONS.folderSystem },
];

export const Default: Story = {
  args: {
    value: 'C:\\Windows',
    history: sampleHistory,
    onNavigate: (path: string) => alert(`Navigate to: ${path}`),
  },
  render: (args) => (
    <div className="window" style={{ width: 600 }}>
      <AddressBar {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: {
    value: '',
    history: [],
  },
  render: (args) => (
    <div className="window" style={{ width: 600 }}>
      <AddressBar {...args} />
    </div>
  ),
};

export const WithCustomLabel: Story = {
  args: {
    value: 'https://www.microsoft.com',
    label: 'Address:',
    history: [
      { path: 'https://www.microsoft.com', label: 'Microsoft' },
      { path: 'https://www.google.com', label: 'Google' },
    ],
  },
  render: (args) => (
    <div className="window" style={{ width: 600 }}>
      <AddressBar {...args} />
    </div>
  ),
};
