import type { Config } from 'tailwindcss';
import productConfig from './config/product.config';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: productConfig.theme.primaryColor,
          hover: productConfig.theme.primaryColorHover || productConfig.theme.primaryColor,
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
