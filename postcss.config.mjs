import postcssImport from "postcss-import";

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": postcssImport(),
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
