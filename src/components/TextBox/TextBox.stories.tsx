import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextBox } from './TextBox';

const meta = {
  title: 'Components/TextBox',
  component: TextBox,
  tags: ['autodocs'],
  args: {
    id: 'textbox',
    label: 'Name',
  },
} satisfies Meta<typeof TextBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stacked: Story = {
  args: {
    stacked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
