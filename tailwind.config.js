/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0F',
        surface: '#12121A',
        panel: '#1E1E2E',
        'text-primary': '#E8E8F0',
        'text-muted': '#6B6B8A',
        accent: '#00D4A0',
        gold: '#F5B731',
        danger: '#FF4757',
        up: '#00D4A0',
        down: '#FF4757',
      },
      fontFamily: {
        sans: [
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Noto Sans JP',
          'Yu Gothic',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
