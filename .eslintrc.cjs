/**
 * PRISM ESLint configuration - ESLint 8 "eslintrc" (classic) format.
 *
 * package.json sets `"type": "module"`, so this file MUST keep the `.cjs`
 * extension or ESLint 8 will refuse to load it as CommonJS.
 *
 * Wires up the four plugins already present in devDependencies:
 *   @typescript-eslint     - parser + TYPE-AWARE rules driven by ./tsconfig.json
 *   eslint-plugin-react
 *   eslint-plugin-react-hooks
 *   eslint-plugin-jsx-a11y - `recommended` set, per the WCAG 2.2 AAA claim
 *
 * SEVERITY POLICY
 * ---------------
 * This config is introduced against a codebase that has never been linted.
 * To keep `npm run lint` a usable gate from day one WITHOUT hiding anything:
 *
 *   error = must never appear (currently zero occurrences in src/)
 *   warn  = pre-existing debt, surfaced on every run, capped by the
 *           `--max-warnings` budget in the package.json `lint` script
 *
 * Every rule demoted to `warn` is listed under "PRE-EXISTING DEBT" below with
 * the reason. Lower the `--max-warnings` budget as debt is paid; never raise it.
 */
module.exports = {
  root: true,

  env: {
    browser: true,
    es2022: true,
    worker: true,
  },

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // Type-aware linting. tsconfig.json `include` is ["src"], which covers
    // every file the lint script targets (src/**/*.{ts,tsx}).
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },

  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:jsx-a11y/recommended',
  ],

  settings: {
    react: { version: 'detect' },
  },

  rules: {
    // ===================================================================
    // REACT HOOKS
    // eslint-plugin-react-hooks@4 ships `plugin:react-hooks/recommended`,
    // but it pins exhaustive-deps to `warn`. src/ is currently clean on
    // both rules, so both are pinned to `error` here to keep it that way.
    // ===================================================================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',

    // ===================================================================
    // ZERO-TRUST HARDENING
    // The product claim is "no bytes ever leave your machine", and all
    // parsing runs client-side over untrusted files. These rules are at
    // zero occurrences today and are pinned to `error` so they stay there.
    // ===================================================================
    'no-eval': 'error',
    'no-implied-eval': 'off', // superseded by the type-aware version below
    '@typescript-eslint/no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // ===================================================================
    // CONVENTION, NOT A SOFTENING
    // SmartChart.tsx:172 destructures `yAxisLabel: _yAxisLabel` as a
    // deliberate discard. Honour the leading-underscore convention rather
    // than flagging intentional code. This rule stays at `error`.
    // ===================================================================
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    // ===================================================================
    // PRE-EXISTING DEBT - demoted to `warn`, budgeted in package.json.
    // Fixing any of these requires editing application source, which is
    // out of scope for the commit that introduces this config.
    // ===================================================================

    // -- (1) The Pyodide worker boundary is entirely untyped. -----------
    // postMessage payloads arrive as `any`, so every field read off a
    // worker result trips the no-unsafe-* family. This is the single
    // largest debt cluster (~70 warnings), concentrated in
    // AnalyticsWorkspace.tsx. The real fix is a typed discriminated union
    // for worker responses plus a runtime validator at the boundary -
    // NOT blanket rule suppression.
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // -- (2) Unhandled async in event handlers. -------------------------
    // A real defect class (silently swallowed rejections), but each fix is
    // a behavioural change to a handler, so it cannot land in a
    // config-only commit. Promote to `error` once addressed.
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',

    // -- (3) ACCESSIBILITY. ---------------------------------------------
    // Demoted ONLY so the gate is achievable today. The README claims WCAG
    // 2.2 Level AAA; these warnings are direct counter-evidence to that
    // claim and should be the first debt paid down.
    'jsx-a11y/label-has-associated-control': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // -- (4) Style and mechanical fixes. --------------------------------
    // `prefer-nullish-coalescing`: all 16 current sites were reviewed and
    // none is a live defect (no `||` there swallows a meaningful 0/false).
    // It is `warn` rather than `error` because a blind `--fix` to `??` WOULD
    // introduce one: SmartChart.tsx:553 `{insightText || accessibleSummary}`
    // deliberately falls back when insightText is the EMPTY STRING, which
    // `??` would stop doing, rendering an empty insight. Each site needs a
    // human decision about what its falsy case means.
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/consistent-indexed-object-style': 'warn',
    'no-case-declarations': 'warn',
  },

  overrides: [
    {
      // src/workers/prism.worker.js is a CLASSIC (non-module) worker written
      // in plain JS and is not part of the TS program, so type-aware rules
      // cannot resolve types for it and would throw a parser error.
      files: ['*.js', '*.cjs', '*.mjs'],
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      parserOptions: { project: null },
    },
    {
      // Ambient declaration files: `declare module` bodies legitimately
      // contain names that look unused.
      files: ['*.d.ts'],
      rules: { '@typescript-eslint/no-unused-vars': 'off' },
    },
    {
      // Test sources. These live under src/, so tsconfig.json `include`
      // already puts them in the TS program and type-aware rules work.
      // The relaxations below are patterns that are correct IN A TEST and
      // would be wrong to flag:
      //   - no-empty-function: `() => {}` noop stubs are the whole point of
      //     a jsdom API shim (see src/test/setup.ts matchMedia listeners).
      //   - no-non-null-assertion / no-explicit-any: assertions and fixture
      //     builders routinely reach past the type system on purpose.
      //   - unbound-method: `expect(obj.method)` is idiomatic with vitest.
      // Accessibility rules are deliberately NOT relaxed here.
      files: [
        'src/test/**/*.{ts,tsx}',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      env: { node: true }, // setup.ts imports `node:crypto`
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/unbound-method': 'off',
        // Security tests carry attack strings as FIXTURES. For example
        // src/test/security/validator.content.test.ts:24 asserts that a CSV
        // cell containing `javascript:alert(1)` is REJECTED. Flagging the
        // fixture would punish the test for testing the right thing.
        // The rule stays at `error` for application code.
        'no-script-url': 'off',
        // Demoted, NOT disabled. An `async` test callback with no `await` is
        // usually just cosmetic (InsightCard.a11y.test.tsx:60 is a synchronous
        // assertion marked async). But in an a11y suite a missing await is
        // also how `expect(await axe(c))` silently degrades into asserting on
        // a pending Promise, so the signal is kept visible as a warning.
        '@typescript-eslint/require-await': 'warn',
      },
    },
  ],

  ignorePatterns: [
    'dist/',
    'node_modules/',
    'src/python/', // Python sources; also excluded by tsconfig.json
    '*.config.js', // postcss.config.js, tailwind.config.js
    // Root-level TS config files sit outside tsconfig.json `include`, so the
    // type-aware parser has no program for them. They are also outside the
    // `src` target of the lint script; ignoring them keeps a bare
    // `npx eslint .` from erroring.
    'vite.config.ts',
    'vitest.config.ts',
    'vitest.a11y.config.ts',
  ],
};
