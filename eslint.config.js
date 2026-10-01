// Root ESLint config — Cloudflare Pages Functions only.
//
// Why this exists: `npm run lint` only ever ran against the client-app workspace,
// so the whole of functions/ — the API, including the 2400-line planner — was
// never linted. A planner rule referencing `bodyProfile`, a variable that is a
// parameter of a *sibling* function and not in scope, parsed fine, passed smoke,
// deployed, and threw ReferenceError on every plan generation (PLAN-500).
//
// no-undef is the rule that catches exactly that, and it is an error here.
// Everything else from `recommended` is a warning: this config is retrofitted
// onto existing code, and a wall of pre-existing style warnings would train
// people to ignore the output. Warnings are visible; only real scope and syntax
// errors block a deploy.

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.worker,
        ...globals.serviceworker,
        // Workers runtime globals the `globals` presets do not carry.
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        structuredClone: 'readonly',
      },
    },
    rules: {
      // Downgrade recommended to warnings…
      ...Object.fromEntries(
        Object.keys(js.configs.recommended.rules).map((r) => [r, 'warn'])
      ),
      // …except the ones that mean "this will throw at runtime".
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
      'no-class-assign': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-obj-calls': 'error',
      'use-isnan': 'error',
      'no-unused-vars': 'off',
    },
  },
];
