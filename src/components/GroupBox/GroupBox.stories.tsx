import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupBox } from './GroupBox';

const meta = {
  title: 'Components/GroupBox',
  component: GroupBox,
  tags: ['autodocs'],
  args: {
    legend: 'Title',
    children: 'Children go here',
  },
} satisfies Meta<typeof GroupBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLegend: Story = {
  args: {
    legend: undefined,
  },
};
