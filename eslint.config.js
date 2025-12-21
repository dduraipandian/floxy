import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  {
    ignores: ["_app/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        bootstrap: "readonly",
        global: "readonly",
        $: "readonly",
        jQuery: "readonly",
        navigator: "readonly",
        document: "readonly",
        window: "readonly",
        HTMLElement: "readonly",
        CustomEvent: "readonly",
      },
    },
    rules: {
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": ["warn"],
      "no-console": "off",
      "import/extensions": ["error", "always"],
    },
  },
];
