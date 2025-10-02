/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  safelist: [
    'from-orange-600', 'to-orange-700', 'from-orange-300', 'from-orange-400', 'via-orange-400',
    'from-green-600', 'to-green-700', 'from-red-600', 'to-red-700',
    'text-orange-300', 'text-orange-400', 'text-orange-600',
    'border-orange-400', 'border-orange-500',
    'bg-gradient-to-br', 'bg-gradient-to-r', 'bg-clip-text', 'bg-transparent',
    'shadow-xl', 'shadow-2xl', 'shadow-lg', 'shadow-md', 'hover:shadow-xl', 'hover:shadow-lg'
  ],
  plugins: [],
};