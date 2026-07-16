import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1A2E",
        inksoft: "#4a4963",
        paper: "#F5F5F2",
        card: "#ffffff",
        line: "#e5e4e0",
        slate2: "#2c3142",
        chalk: "#f3f1ea",
        accent: {
          DEFAULT: "#4C3AE3",
          ink: "#3a2bc0",
          soft: "#eeecfd",
        },
        credit: { DEFAULT: "#0E9E82", soft: "#e2f4ef" },
        debit: { DEFAULT: "#E5484D", soft: "#fdeceb" },
        amber2: { DEFAULT: "#E8912D", soft: "#fdf1e2" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,26,46,0.05), 0 12px 32px -14px rgba(27,26,46,0.18)",
        pop: "0 2px 6px rgba(27,26,46,0.08), 0 16px 40px -16px rgba(27,26,46,0.22)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
