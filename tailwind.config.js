
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        cream: '#FDF8F0',
        parchment: '#F5EDE0',
        warm: {
          100: '#F0E6D6',
          200: '#E0D0B8',
          300: '#C4A882',
          400: '#A8865A',
          500: '#8B6B3D',
          600: '#6E5230',
          700: '#523D24',
          800: '#3A2B1A',
          900: '#231A10',
        },
        heritage: {
          red: '#8B2500',
          'red-light': '#A63D1A',
          gold: '#C49A3C',
          'gold-light': '#D4B05C',
          'gold-muted': '#B8956A',
          sage: '#6B7F5E',
          'sage-light': '#8A9E7C',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Be Vietnam Pro', 'sans-serif'],
      },
    },
  },
}
