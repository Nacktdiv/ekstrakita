import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E293B", // Primary Deep Navy
          blue: "#3B82F6",    // Accent Blue
        },
        status: {
          success: "#10B981", // Emerald Green (Available / Approved)
          warning: "#F59E0B", // Amber (Pending / Menunggu TTD)
          danger: "#EF4444",  // Rose Red (Borrowed / Maintenance / Expense)
          neutral: "#64748B", // Slate Gray (Borders / Secondary Text)
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
