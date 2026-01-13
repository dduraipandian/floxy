import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import nesting from "postcss-nesting";

const publishSourceMap = process.env.PUBLISH_SOURCEMAP ?? false;

const cssPlugin = postcss({
  extract: "floxy.css",
  minimize: true,
  sourceMap: publishSourceMap,
  plugins: [nesting()],
});

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
      file: "dist/floxy.min.js",
      format: "iife", // browser-friendly
      name: "floxy", // window.floxy
      sourcemap: publishSourceMap,
      plugins: [terser()],
    },
  ],
  plugins: [resolve(), commonjs(), cssPlugin],
};
