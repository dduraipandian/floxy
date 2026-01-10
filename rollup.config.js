import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";

const publishSourceMap = process.env.PUBLISH_SOURCEMAP === "true";

export default {
  input: "index.js",

  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: publishSourceMap,
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: publishSourceMap,
    },
    {
      file: "dist/floxy.js",
      format: "iife",           // browser-friendly
      name: "floxy",            // window.Floxy
      sourcemap: publishSourceMap
    }
  ],

  plugins: [
    resolve({
      browser: true
    }),

    commonjs(),

    postcss({
      extract: true,          // dist/floxy.css
      minimize: true,
      sourceMap: true
    }),

    terser()
  ]
};