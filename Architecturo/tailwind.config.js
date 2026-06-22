/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: '#0c0e14',
        panel: '#151823',
        'panel-2': '#1c2030',
        line: '#2a2f42',
        accent: '#6366f1',
      },
      boxShadow: {
        node: '0 4px 16px -2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        panel: '0 8px 40px -8px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'graph-in': {
          '0%': { opacity: '0', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'graph-out': {
          '0%': { opacity: '0', transform: 'scale(0.82)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        dive: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '45%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'scale(2.2)' },
        },
        surface: {
          '0%': { opacity: '0', transform: 'scale(1.8)' },
          '45%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'scale(0.7)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out both',
        'fade-up': 'fade-up .45s cubic-bezier(.16,1,.3,1) both',
        'scale-in': 'scale-in .25s ease-out both',
        'graph-in': 'graph-in .55s cubic-bezier(.16,1,.3,1) both',
        'graph-out': 'graph-out .55s cubic-bezier(.16,1,.3,1) both',
        dive: 'dive .5s ease-in forwards',
        surface: 'surface .5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
