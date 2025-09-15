import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // General rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "no-useless-return": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      
      // React/Next.js rules
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];

export default eslintConfig;
