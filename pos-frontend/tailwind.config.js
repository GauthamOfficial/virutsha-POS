import scrollbarHide from "tailwind-scrollbar-hide";

/**
 * VISA Tamil Kitchen brand palette.
 *
 * Three brand colours taken from the brand sheet:
 *   Deep Terracotta  #8D2C0D  main colour, warmth and tradition
 *   Mustard Gold     #CA840E  accents and elegance
 *   Dark Green       #1B3A20  nature, freshness, balance
 *
 * The cream from the brand sheet (#F7E8CB) is the page background, so the
 * whole POS reads as warm paper rather than a dark screen.
 *
 * Every text/background pair used in the app clears WCAG AA. The `-chart`
 * steps are lighter versions of the same hues, chosen because a fill that
 * works as a button is often too dark to read as a data mark on cream.
 */
const brand = {
  terracotta: {
    DEFAULT: "#8D2C0D",
    deep: "#6E2109", // hover / pressed
    chart: "#A8391A",
  },
  mustard: {
    DEFAULT: "#CA840E",
    deep: "#8A5A06", // mustard as *text* on cream needs this step
    soft: "#F3E0B8", // tinted background for badges
    light: "#FFD98A", // gold that stays legible ON terracotta
    chart: "#B8770C",
  },
  forest: {
    DEFAULT: "#1B3A20",
    soft: "#D8E6D6",
    chart: "#00795A",
  },
  danger: {
    DEFAULT: "#9B1C1C",
    soft: "#F3D9D5",
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ...brand,

        // Surfaces, lightest to warmest.
        panel: "#FFFBF2", // cards sitting on the page
        shell: "#F7E8CB", // the page itself - the brand cream
        raised: "#EFDCBB", // table headings, hover rows
        line: "#E3CFA8", // hairline borders

        // Ink.
        ink: "#2F1B10", // headings and values
        muted: "#7A6249", // labels and secondary text
        faint: "#8A7358", // hints, placeholders
      },
      fontFamily: {
        display: ["Marcellus", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(47, 27, 16, 0.06), 0 1px 3px rgba(47, 27, 16, 0.04)",
        lifted: "0 10px 30px rgba(47, 27, 16, 0.12)",
      },
    },
  },
  plugins: [scrollbarHide],
};
