/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#14222b",
        mist: "#f7f2ea",
        cream: "#fcf9f3",
        line: "#e4d7c6",
        accent: "#0F6175",
        secondary: "#2F7F8A",
        ember: "#E59B26",
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
        manrope: ["Manrope_400Regular"],
        "manrope-medium": ["Manrope_500Medium"],
        "manrope-semibold": ["Manrope_600SemiBold"],
        "manrope-bold": ["Manrope_700Bold"],
        guidance: ["Manrope_400Regular"],
      },
    },
  },
  plugins: [],
};
