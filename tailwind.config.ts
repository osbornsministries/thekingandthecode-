import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#A81010', // Deep festive red
          gold: '#C5A059', // Muted elegant gold
          dark: '#1A1A1A',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)'],
        script: ['var(--font-great-vibes)'],
      },
    },
  },
  plugins: [],
};
export default config;