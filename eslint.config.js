import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/', 'coverage/', 'test-results/', 'playwright-report/', 'blob-report/']),
  js.configs.recommended,
  {
    // Type-aware rules for application, test, browser-test, and tooling source.
    // Every TypeScript file must belong to a project referenced by tsconfig.json.
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // React hook rules apply to browser source only; Playwright fixtures also
    // use a callback named `use`, which is not a React hook.
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
]);
