import type { Meta, StoryObj } from '@storybook/react-vite';
import { StartMenu } from './StartMenu';
import type { StartMenuItem } from './StartMenu';

const meta: Meta<typeof StartMenu> = {
  title: 'Components/StartMenu',
  component: StartMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof StartMenu>;

const defaultItems: StartMenuItem[] = [
  {
    type: 'submenu',
    label: 'プログラム(P)',
    icon: 'folderWindows',
    items: [
      { type: 'item', label: 'アクセサリ', icon: 'folderClosed' },
      { type: 'item', label: 'Internet Explorer', icon: 'fileHtml' },
      { type: 'separator' },
      { type: 'item', label: 'MS-DOS プロンプト', icon: 'fileScript' },
    ],
  },
  {
    type: 'submenu',
    label: 'お気に入り(A)',
    icon: 'folderOpen',
    items: [
      { type: 'item', label: 'チャンネル', icon: 'fileGeneric' },
      { type: 'item', label: 'リンク', icon: 'fileGeneric' },
    ],
  },
  { type: 'separator' },
  { type: 'item', label: 'ドキュメント(D)', icon: 'myDocuments' },
  { type: 'item', label: '設定(S)', icon: 'properties' },
  { type: 'item', label: '検索(C)', icon: 'fileGeneric' },
  { type: 'item', label: 'ヘルプ(H)', icon: 'fileText' },
  { type: 'separator' },
  { type: 'item', label: 'ファイル名を指定して実行(R)...', icon: 'fileExecutable' },
  { type: 'separator' },
  { type: 'item', label: 'ログオフ(U)...', icon: 'desktop' },
  { type: 'item', label: '終了(U)...', icon: 'windowsLogo' },
];

const disabledItems: StartMenuItem[] = [
  { type: 'item', label: 'ドキュメント(D)', icon: 'myDocuments' },
  { type: 'separator' },
  { type: 'item', label: '設定(S)', icon: 'properties', disabled: true },
  { type: 'item', label: '検索(C)', icon: 'fileGeneric', disabled: true },
  { type: 'item', label: 'ヘルプ(H)', icon: 'fileText' },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    onClose: () => {},
  },
};

export const Disabled: Story = {
  args: {
    items: disabledItems,
    onClose: () => {},
  },
};
