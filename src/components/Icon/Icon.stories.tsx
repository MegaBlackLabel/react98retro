import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/icons';

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

function IconGrid({
  icons,
  size = 32,
}: {
  icons: { name: IconName; label: string }[];
  size?: 16 | 32;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 8, background: '#c0c0c0' }}>
      {icons.map(({ name, label }) => (
        <div
          key={name}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 80 }}
        >
          <Icon name={name} size={size} alt={label} style={{ imageRendering: 'auto' }} />
          <span style={{ fontSize: 10, fontFamily: "'Pixelated MS Sans Serif','DotGothic16',Arial,sans-serif", color: '#000', textAlign: 'center', wordBreak: 'break-word' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export const Drives: Story = {
  render: () => (
    <IconGrid size={32} icons={[
      { name: 'hardDrive',      label: 'ハードディスク' },
      { name: 'floppyDrive',    label: 'フロッピー' },
      { name: 'cdDrive',        label: 'CD/DVD' },
      { name: 'networkDrive',   label: 'ネットワーク' },
      { name: 'removableDrive', label: 'リムーバブル' },
    ]} />
  ),
};

export const Folders: Story = {
  render: () => (
    <IconGrid size={32} icons={[
      { name: 'folderClosed',  label: 'フォルダ' },
      { name: 'folderOpen',    label: 'フォルダ(開)' },
      { name: 'folderWindows', label: 'Windowsフォルダ' },
      { name: 'folderSystem',  label: 'システム' },
      { name: 'myDocuments',   label: 'マイドキュメント' },
    ]} />
  ),
};

export const System: Story = {
  render: () => (
    <IconGrid size={32} icons={[
      { name: 'myComputer',      label: 'マイコンピュータ' },
      { name: 'recycleBinEmpty', label: 'ごみ箱(空)' },
      { name: 'recycleBinFull',  label: 'ごみ箱(有)' },
      { name: 'desktop',         label: 'デスクトップ' },
      { name: 'shellWindow',     label: 'エクスプローラー' },
      { name: 'windowsLogo',     label: 'Windowsロゴ' },
    ]} />
  ),
};

export const Files: Story = {
  render: () => (
    <IconGrid size={32} icons={[
      { name: 'fileGeneric',    label: 'ファイル' },
      { name: 'fileText',       label: 'テキスト' },
      { name: 'fileExecutable', label: '実行ファイル' },
      { name: 'fileImage',      label: '画像' },
      { name: 'fileHtml',       label: 'HTML' },
      { name: 'fileScript',     label: 'スクリプト' },
    ]} />
  ),
};

export const ToolbarActions: Story = {
  render: () => (
    <IconGrid size={32} icons={[
      { name: 'back',       label: '戻る' },
      { name: 'forward',    label: '進む' },
      { name: 'up',         label: '上へ' },
      { name: 'cut',        label: '切り取り' },
      { name: 'copy',       label: 'コピー' },
      { name: 'paste',      label: '貼り付け' },
      { name: 'delete',     label: '削除' },
      { name: 'properties', label: 'プロパティ' },
    ]} />
  ),
};

export const SizesComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: '#c0c0c0', padding: 16 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'Arial', color: '#000' }}>16px</p>
        <IconGrid size={16} icons={[
          { name: 'myComputer', label: 'マイPC' },
          { name: 'folderClosed', label: 'フォルダ' },
          { name: 'hardDrive', label: 'HDD' },
          { name: 'back', label: '戻る' },
          { name: 'copy', label: 'コピー' },
        ]} />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'Arial', color: '#000' }}>32px</p>
        <IconGrid size={32} icons={[
          { name: 'myComputer', label: 'マイPC' },
          { name: 'folderClosed', label: 'フォルダ' },
          { name: 'hardDrive', label: 'HDD' },
          { name: 'back', label: '戻る' },
          { name: 'copy', label: 'コピー' },
        ]} />
      </div>
    </div>
  ),
};
