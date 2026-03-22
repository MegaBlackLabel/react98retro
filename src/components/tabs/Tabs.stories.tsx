import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: {
    tabs: [
      { id: 'general', label: 'General', content: 'General settings' },
      { id: 'appearance', label: 'Appearance', content: 'Appearance settings' },
      { id: 'advanced', label: 'Advanced', content: 'Advanced settings' },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicTabs: Story = {};

export const MultirowsTabs: Story = {
  args: {
    multirows: true,
    tabs: [
      { id: 'tab1', label: 'Tab 1', content: 'Tab 1 content' },
      { id: 'tab2', label: 'Tab 2', content: 'Tab 2 content' },
      { id: 'tab3', label: 'Tab 3', content: 'Tab 3 content' },
      { id: 'tab4', label: 'Tab 4', content: 'Tab 4 content' },
      { id: 'tab5', label: 'Tab 5', content: 'Tab 5 content' },
      { id: 'tab6', label: 'Tab 6', content: 'Tab 6 content' },
    ],
  },
};

export const ControlledTabs: Story = {
  args: {
    activeTab: 'general',
  },
};
