import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

const basicItems: MenuItem[] = [
  { label: '開く', onClick: () => alert('開く') },
  { label: '保存', onClick: () => alert('保存') },
  { label: '名前を付けて保存', onClick: () => alert('名前を付けて保存') },
  { type: 'separator' },
  { label: '印刷', onClick: () => alert('印刷') },
  { type: 'separator' },
  { label: '閉じる', onClick: () => alert('閉じる') },
];

const withDisabledItems: MenuItem[] = [
  { label: '元に戻す', disabled: true },
  { type: 'separator' },
  { label: '切り取り', onClick: () => {} },
  { label: 'コピー', onClick: () => {} },
  { label: '貼り付け', disabled: true },
  { type: 'separator' },
  { label: 'すべて選択', onClick: () => {} },
];

const withCheckedItems: MenuItem[] = [
  { label: 'ツールバー', checked: true, onClick: () => {} },
  { label: 'ステータスバー', checked: true, onClick: () => {} },
  { label: 'エクスプローラーバー', checked: false, onClick: () => {} },
  { type: 'separator' },
  { label: '大きいアイコン', checked: false, onClick: () => {} },
  { label: '小さいアイコン', checked: false, onClick: () => {} },
  { label: '一覧', checked: false, onClick: () => {} },
  { label: '詳細', checked: true, onClick: () => {} },
];

const nestedItems: MenuItem[] = [
  {
    label: '新規作成',
    children: [
      { label: 'フォルダ', onClick: () => {} },
      { label: 'ショートカット', onClick: () => {} },
      { type: 'separator' },
      { label: 'テキスト ドキュメント', onClick: () => {} },
    ],
  },
  { type: 'separator' },
  { label: '開く', onClick: () => {} },
  {
    label: '送る',
    children: [
      { label: 'デスクトップ (ショートカットを作成)', onClick: () => {} },
      { label: 'メール受信者', onClick: () => {} },
    ],
  },
  { type: 'separator' },
  { label: '削除', onClick: () => {} },
  { label: '名前の変更', onClick: () => {} },
  { type: 'separator' },
  { label: 'プロパティ', onClick: () => {} },
];

export const Basic: Story = {
  args: { items: basicItems },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <Menu {...args} />
    </div>
  ),
};

export const WithDisabled: Story = {
  args: { items: withDisabledItems },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <Menu {...args} />
    </div>
  ),
};

export const WithChecked: Story = {
  args: { items: withCheckedItems },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <Menu {...args} />
    </div>
  ),
};

export const Nested: Story = {
  args: { items: nestedItems },
  render: (args) => (
    <div style={{ background: '#c0c0c0', padding: 16 }}>
      <Menu {...args} />
    </div>
  ),
};
