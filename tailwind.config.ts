import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stonehill: {
          // Phase 15R brand palette — match the live Stonehill site.
          primary: "var(--color-stonehill-primary)",
          accent: "var(--color-stonehill-accent)",
          secondary: "var(--color-stonehill-secondary)",
          dark: "var(--color-stonehill-dark)",
          light: "var(--color-stonehill-light)",
          border: "var(--color-stonehill-border)",
          "border-hover": "var(--color-stonehill-border-hover)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        handwritten: ["var(--font-handwritten)", "Comic Sans MS", "cursive"],
      },
      boxShadow: {
        soft: "0 18px 60px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [typography],
};

export default config;
