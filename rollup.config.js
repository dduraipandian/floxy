import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import nesting from "postcss-nesting";

const devEnvironment = process.env.DEVELOPMENT ?? false;

const cssPlugin = postcss({
  extract: "floxy.css",
  minimize: !devEnvironment,
  sourceMap: devEnvironment,
  plugins: [nesting()],
});

export default {
  input: "index.js",

  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: devEnvironment,
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: devEnvironment,
    },
    {
      file: "dist/floxy.min.js",
      format: "iife", // browser-friendly
      name: "floxy", // window.floxy
      sourcemap: devEnvironment,
      plugins: devEnvironment ? [] : [terser()],
    },
  ],
  plugins: [resolve(), commonjs(), cssPlugin],
};
