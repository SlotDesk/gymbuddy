import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#faf9f5",
        card: "#f3f1eb",
        accent: "#22c55e",
        coral: "#cc785c",
      },
    },
  },
  plugins: [],
};

export default config;
