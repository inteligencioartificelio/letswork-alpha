import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        editorial: ["var(--font-editorial)", "sans-serif"],
        technical: ["var(--font-technical)", "monospace"],
      },
      colors: {
        paper: "var(--color-bg-paper)",
        surface: "var(--color-bg-surface)",
        ink: "var(--color-ink-primary)",
        "ink-muted": "var(--color-ink-muted)",
        "ink-border": "var(--color-ink-border)",
        highlight: "var(--color-accent-highlight)",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
      },
    },
  },
  plugins: [],
};

export default config;
