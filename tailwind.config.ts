import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        dungeon: {
          950: "#0b0c10",
          900: "#13151b",
          850: "#1a1d26",
          800: "#222634",
          700: "#2e3447",
          600: "#414a63",
        },
        amber: {
          450: "#e0a12e",
        }
      },
    },
  },
  plugins: [],
};
export default config;
