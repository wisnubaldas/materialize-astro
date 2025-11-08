const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './src/content/**/*.{md,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Ubuntu"', ...defaultTheme.fontFamily.sans],
        mono: ['"Ubuntu Mono"', ...defaultTheme.fontFamily.mono]
      },
      colors: {
        brand: {
          DEFAULT: 'hsla(var(--color-purple), 1)',
          muted: 'hsla(var(--color-purple), 0.15)'
        }
      }
    }
  }
}
