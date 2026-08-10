const tseslint = require("typescript-eslint");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const jsxA11yPlugin = require("eslint-plugin-jsx-a11y");
const nextPlugin = require("@next/eslint-plugin-next");
const unusedImportsPlugin = require("eslint-plugin-unused-imports");
const tailwindcssPlugin = require("eslint-plugin-tailwindcss");

module.exports = tseslint.config(
  {
    ignores: [
      ".eslintrc.js",
      "next.config.js",
      "postcss.config.js",
      "tailwind.config.ts",
      "*.config.js",
      "*.config.mjs",
      "node_modules/",
      ".next/",
      ".content-collections/",
      "playwright-visual-report/",
      "playwright-report/",
      "build/",
      "dist/",
      "components.json",
      ".claude/",
      "storybook-static/",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    settings: {
      react: { version: "19.2.8" },
      next: { rootDir: __dirname },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
      "unused-imports": unusedImportsPlugin,
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/prop-types": "off",
    },
  },
);
