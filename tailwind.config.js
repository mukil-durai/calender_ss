/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Lora', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      screens: {
        'xxs': '380px',
        'xs': '480px',
      },
      minHeight: {
        '16': '4rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      gridTemplateRows: {
        'calendar': 'auto 1fr',
      },
    },
  },
  plugins: [],
  safelist: [
    { pattern: /bg-(blue|green|red|purple|yellow|indigo|pink|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-(blue|green|red|purple|yellow|indigo|pink|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-(blue|green|red|purple|yellow|indigo|pink|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /from-(blue|green|red|purple|yellow|indigo|pink|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /to-(blue|green|red|purple|yellow|indigo|pink|gray)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],
}