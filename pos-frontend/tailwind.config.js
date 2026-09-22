import scrollbarHide from "tailwind-scrollbar-hide";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // The dark counter-top palette the whole POS is built on.
        shell: "#1f1f1f",
        panel: "#1a1a1a",
        raised: "#262626",
        line: "#2a2a2a",
        ink: "#f5f5f5",
        muted: "#ababab",
        faint: "#6b6b6b",
        brand: "#f6b100",
        cash: "#02ca3a",
        card: "#025cca",
      },
    },
  },
  plugins: [scrollbarHide],
};
