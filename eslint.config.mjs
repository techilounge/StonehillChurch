import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Existing `any` debt is concentrated in the page builder and is being
      // paid down incrementally (BACKLOG QA-004). Keep it visible as a warning
      // so new code is flagged without blocking CI on legacy code.
      "@typescript-eslint/no-explicit-any": "warn",
      // Purely stylistic: React escapes text content, so apostrophes and
      // quotes in JSX text are safe.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Plain Node scripts are CommonJS by design.
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-stale-*/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
