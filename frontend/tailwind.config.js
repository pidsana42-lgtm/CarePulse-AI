/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontSize: {
        'elderly-base': '1.25rem', // 20px
        'elderly-lg': '1.5rem',   // 24px
        'elderly-xl': '1.875rem', // 30px
      }
    },
  },
  plugins: [],
};
