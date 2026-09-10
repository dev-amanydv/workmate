import babelParser from "@babel/eslint-parser";
import { config as baseConfig } from "@repo/eslint-config/base";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-typescript"],
          plugins: [
            ["@babel/plugin-proposal-decorators", { version: "legacy" }],
            ["@babel/plugin-transform-class-properties", { loose: true }],
          ],
        },
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
