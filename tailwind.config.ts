import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sp: {
          primary: {
            50:  '#EEF2FF',
            100: '#C7D2FE',
            400: '#1B4DFF',
            600: '#1338CC',
            900: '#0A1F7A',
          },
          gray: {
            50:  '#F2F4F7',
            100: '#E4E8F0',
            400: '#8890A4',
            600: '#4A5568',
            900: '#1A202C',
          },
          green: {
            50:  '#ECFDF5',
            400: '#10B981',
            600: '#047857',
          },
          amber: {
            50:  '#FFF8E6',
            400: '#D97706',
          },
          red: {
            50:  '#FEF2F2',
            400: '#EF4444',
          },
        },
      },
      borderRadius: {
        'sp-sm': '6px',
        'sp-md': '10px',
        'sp-lg': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
