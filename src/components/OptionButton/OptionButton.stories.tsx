import type { Meta, StoryObj } from '@storybook/react-vite';
import { OptionButton } from './OptionButton';

const meta = {
  title: 'Components/OptionButton',
  component: OptionButton,
  tags: ['autodocs'],
  args: {
    id: 'radio',
    name: 'group',
    label: 'Option 1',
  },
} satisfies Meta<typeof OptionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
