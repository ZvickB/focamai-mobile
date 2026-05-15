/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#f4f7fb",
        line: "#d8e0ea",
        accent: "#3d7ef0",
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
        manrope: ["Manrope_400Regular"],
        "manrope-medium": ["Manrope_500Medium"],
        "manrope-semibold": ["Manrope_600SemiBold"],
        "manrope-bold": ["Manrope_700Bold"],
      },
    },
  },
  plugins: [],
};
