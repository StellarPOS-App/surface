import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: '#F5F0E6' },
        { name: 'dark', value: '#1C1A16' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    chromatic: {
      // Capture both themes; Chromatic compares each snapshot against its own baseline.
      modes: {
        light: { backgrounds: { value: '#F5F0E6' } },
        dark: { backgrounds: { value: '#1C1A16' } },
      },
    },
  },
};

export default preview;
