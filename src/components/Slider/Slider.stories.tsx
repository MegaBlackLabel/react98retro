import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Volume',
    min: 0,
    max: 100,
    defaultValue: 50,
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BoxIndicator: Story = {
  args: {
    boxIndicator: true,
  },
};

export const Vertical: Story = {
  args: {
    vertical: true,
  },
};
