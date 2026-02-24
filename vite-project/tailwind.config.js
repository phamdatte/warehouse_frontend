/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        sidebar: {
          bg:     '#1E293B',
          hover:  '#334155',
          active: '#3B82F6',
          text:   '#CBD5E1',
        },
      },
    },
  },
  plugins: [],
};
