import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '98.css';
import './preview.css';
import { Win98Provider } from '../src/components/Win98Provider';

const preview: Preview = {
  decorators: [
    (Story) => React.createElement(Win98Provider, null, React.createElement(Story)),
  ],
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