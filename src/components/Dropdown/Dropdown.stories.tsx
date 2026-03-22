import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown } from './Dropdown';

const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Rating',
    options: [
      { value: '5', label: '5 - Incredible!' },
      { value: '4', label: '4 - Great!' },
      { value: '3', label: '3 - Pretty good' },
      { value: '2', label: '2 - Not so great' },
      { value: '1', label: '1 - Unfortunate' },
    ],
  },
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
