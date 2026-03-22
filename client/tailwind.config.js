/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        primary: '#6366f1',
        accent: '#ec4899',
        textLight: '#f8fafc',
        textSecondary: '#94a3b8'
      }
    },
  },
  plugins: [],
}
