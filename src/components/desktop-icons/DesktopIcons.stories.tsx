import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesktopIcons } from './DesktopIcons';
import type { DesktopIconItem } from './DesktopIcons';

const meta: Meta<typeof DesktopIcons> = {
  title: 'Components/DesktopIcons',
  component: DesktopIcons,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DesktopIcons>;

/** ダミーの SVG アイコン (data URI) */
const dummyIcon = (fill: string) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect x='3' y='3' width='26' height='26' rx='2' fill='%23${fill}' stroke='%23000000'/></svg>`;

const defaultItems: DesktopIconItem[] = [
  { id: 'computer', label: 'マイ コンピュータ', icon: dummyIcon('808080'), x: 8, y: 8 },
  { id: 'documents', label: 'マイ ドキュメント', icon: dummyIcon('f0c040'), x: 8, y: 88 },
  { id: 'recyclebin', label: 'ごみ箱', icon: dummyIcon('ffffff'), x: 8, y: 168 },
];

export const Default: Story = {
  args: {
    items: defaultItems,
  },
  render: (args) => (
    <div style={{ width: 480, height: 360, background: '#008080' }}>
      <DesktopIcons {...args} />
    </div>
  ),
};

export const Selected: Story = {
  args: {
    items: defaultItems,
    selectedId: 'computer',
  },
  render: (args) => (
    <div style={{ width: 480, height: 360, background: '#008080' }}>
      <DesktopIcons {...args} />
    </div>
  ),
};
