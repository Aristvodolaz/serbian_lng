import type { Config } from 'tailwindcss';

// Tokens come from DESIGN.md in the repo root.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        enamel: { DEFAULT: '#1B3FA0', hover: '#16337F', active: '#112861' },
        ink: { DEFAULT: '#0E1B3D', soft: '#33415F' },
        ground: '#E8ECFB',
        paper: '#FFFFFF',
        line: '#C9D1EE',
        field: '#6B7AA8',
        danger: '#B81826',
        success: '#17663A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        sans: ['var(--font-text)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { rule: '4px', control: '8px', plate: '12px', phone: '32px' },
      keyframes: { fade: { from: { opacity: '0' } } },
      animation: { fade: 'fade 200ms ease-out' },
      maxWidth: { container: '1200px', prose: '68ch' },
    },
  },
  plugins: [],
} satisfies Config;
