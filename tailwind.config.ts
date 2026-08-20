import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        ivory: "rgb(var(--ivory) / <alpha-value>)",
        forest: "rgb(var(--forest) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        arabic: ["var(--font-amiri)", "serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 24, 21, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;