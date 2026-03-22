import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './SplitButton';
import type { MenuItem } from './SplitButton';
import { ICONS } from '../../icons/icons';

const meta: Meta<typeof SplitButton> = {
  title: 'Components/SplitButton',
  component: SplitButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

const viewItems: MenuItem[] = [
  { label: 'サムネイル', onClick: () => alert('サムネイル') },
  { label: 'タイル', onClick: () => alert('タイル') },
  { label: 'アイコン', onClick: () => alert('アイコン') },
  { label: '一覧', onClick: () => alert('一覧') },
  { label: '詳細', onClick: () => alert('詳細') },
];

const nestedItems: MenuItem[] = [
  {
    label: '表示形式',
    children: [
      { label: '大きいアイコン', onClick: () => {} },
      { label: '小さいアイコン', onClick: () => {} },
      { label: '一覧', onClick: () => {} },
      { label: '詳細', onClick: () => {} },
    ],
  },
  { type: 'separator' },
  { label: '整列', onClick: () => {} },
  { label: '最新の情報に更新', onClick: () => {} },
];

export const Default: Story = {
  args: {
    icon: ICONS.shellWindow,
    label: '表示',
    tooltip: '表示',
    items: viewItems,
  },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <SplitButton {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    icon: ICONS.shellWindow,
    label: '表示',
    tooltip: '表示',
    disabled: true,
    items: viewItems,
  },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <SplitButton {...args} />
    </div>
  ),
};

export const WithNestedMenu: Story = {
  args: {
    icon: ICONS.shellWindow,
    label: '表示オプション',
    tooltip: '表示オプション',
    items: nestedItems,
  },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <SplitButton {...args} />
    </div>
  ),
};

export const MultipleButtons: Story = {
  render: () => (
    <div style={{ background: '#c0c0c0', padding: 16, display: 'flex', gap: 4 }}>
      <SplitButton
        icon={ICONS.shellWindow}
        label="表示"
        items={viewItems}
      />
      <SplitButton
        icon={ICONS.folderClosed}
        label="フォルダ"
        items={[
          { label: 'フォルダを開く', onClick: () => {} },
          { label: '新しいウィンドウで開く', onClick: () => {} },
        ]}
      />
    </div>
  ),
};
