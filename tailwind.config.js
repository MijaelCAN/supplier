import {heroui} from "@heroui/theme"

const colors = {
  rojo: "rgb(214, 0, 28)",
  azul: "rgb(9, 87, 195)",
  gris: "rgb(37, 55, 70)",
  blanco: "#ffffff",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        vistony:["vistony-light","sans-serif"],
      }
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
