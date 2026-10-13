import type { Meta, StoryObj } from '@storybook/react-vite';
import { Groove } from './Groove';

const meta: Meta<typeof Groove> = {
  title: 'Components/Groove',
  component: Groove,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Groove>;

/** 帯と帯の間 (横)。上が暗 #808080、下が明 #ffffff の凹んだ 2px。 */
export const Horizontal: Story = {
  render: () => (
    <div style={{ background: '#c0c0c0', width: 320 }}>
      <div style={{ height: 22 }} />
      <Groove />
      <div style={{ height: 22 }} />
    </div>
  ),
};

/** メニューバーの右端のような、同じ帯の中の区切り (縦)。 */
export const Vertical: Story = {
  render: () => (
    <div style={{ background: '#c0c0c0', display: 'flex', alignItems: 'stretch', height: 22, width: 320 }}>
      <div style={{ flex: 1 }} />
      <Groove orientation="vertical" />
      <div style={{ width: 22 }} />
    </div>
  ),
};
