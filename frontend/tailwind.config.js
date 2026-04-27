/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b1326",
        "aurora-bg": "#050A15",
        "aurora-1": "#7dd3fc",
        "aurora-2": "#c5eaff",
        "aurora-3": "#7ad7c6",
        surface: "#171f33",
        primary: "#c5eaff",
        secondary: "#7ad7c6",
        tertiary: "#7dd3fc",
        "on-surface": "#dae2fd",
        "on-surface-variant": "#bec8ce",
      },
    },
  },
  plugins: [],
}