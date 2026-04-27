/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b1326",
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