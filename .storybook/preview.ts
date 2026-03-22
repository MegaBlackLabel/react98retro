import type { Preview } from '@storybook/react-vite';
import '98.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'win98',
      values: [
        { name: 'win98', value: '#c0c0c0' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;