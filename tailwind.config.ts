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
          evergreen: "var(--color-evergreen)",
          forest: "var(--color-forest)",
          leaf: "var(--color-leaf)",
          gold: "var(--color-gold)",
          cream: "var(--color-cream)",
          ink: "var(--color-ink)",
          muted: "var(--color-muted)",
          line: "var(--color-line)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [typography],
};

export default config;
