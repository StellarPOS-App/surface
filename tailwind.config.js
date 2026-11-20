import forms from '@tailwindcss/forms';

/**
 * StellarPOS visual language: a till receipt. Warm paper, ink-black type,
 * monospace figures, and color reserved for meaning: each payment method
 * has its own hue, used consistently from the tender buttons to the
 * reports.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          2: 'rgb(var(--paper-2) / <alpha-value>)',
          3: 'rgb(var(--paper-3) / <alpha-value>)',
          card: 'rgb(var(--card) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
          3: 'rgb(var(--ink-3) / <alpha-value>)',
          line: 'rgb(var(--line) / <alpha-value>)',
        },
        cash: { DEFAULT: '#2F6B3B', soft: '#DCEBD9', ink: '#1E4A27' },
        card: { DEFAULT: '#B4532A', soft: '#F6DFD2', ink: '#7C3519' },
        lumen: { DEFAULT: '#3B3FB6', soft: '#DFE0F7', ink: '#26297E' },
        signal: { DEFAULT: '#C2410C', soft: '#FBE3D6' },
        amber: { DEFAULT: '#A16207', soft: '#F8EBC8' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        slip: '0 1px 0 rgb(var(--line)), 0 10px 30px -18px rgb(28 26 22 / 0.45)',
        press: 'inset 0 -3px 0 rgb(0 0 0 / 0.18)',
      },
      keyframes: {
        'print-in': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse_ring: {
          '0%': { boxShadow: '0 0 0 0 rgb(59 63 182 / 0.35)' },
          '100%': { boxShadow: '0 0 0 14px rgb(59 63 182 / 0)' },
        },
      },
      animation: {
        'print-in': 'print-in 180ms ease-out',
        'pulse-ring': 'pulse_ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [forms],
};
