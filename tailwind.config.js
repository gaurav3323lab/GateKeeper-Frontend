/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        primaryEmerald: '#10b981',
        primaryIndigo: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.4)',
        'neon-emerald': '0 0 15px rgba(16, 185, 129, 0.4)',
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.4)',
      },
      keyframes: {
        'mesh-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'mesh': 'mesh-shift 15s ease infinite',
      },
    },
  },
  plugins: [],
}
