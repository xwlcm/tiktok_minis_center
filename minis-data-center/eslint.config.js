import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import vueParser from 'vue-eslint-parser'
import pluginMinis from 'eslint-plugin-minis'
import globals from 'globals'

export default [
  // ── 忽略目录 ──────────────────────────────────────────────
  {
    ignores: ['node_modules/**', 'dist/**', 'auto-imports.d.ts', 'components.d.ts'],
  },

  // ── JS 基础规则 ───────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript 文件 ───────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      minis: pluginMinis,
    },
    rules: {
      // TypeScript 基础
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // ── 规范 3.5.3：分页 API 返回值必须解构 .list ──────────
      'minis/require-pagination-list-destructure': 'error',

      // ── 规范 3.5.5 + 3.5.6：Mock 正则必须兼容 query string ─
      'minis/require-mock-regex-query-compat': 'error',
      'minis/require-mock-url-split-query': 'error',
    },
  },

  // ── Vue 单文件组件 ────────────────────────────────────────
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tsPlugin,
      minis: pluginMinis,
    },
    rules: {
      // Vue 核心规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/html-self-closing': ['warn', {
        html: { void: 'always', normal: 'never', component: 'always' },
      }],

      // TypeScript in Vue
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // ── 规范 3.5.1：a-statistic :value 不能绑定字符串字面量 ─
      'minis/no-statistic-string-value': 'error',

      // ── 规范 3.5.2：a-statistic prefix 必须用插槽 ──────────
      'minis/no-statistic-prefix-prop': 'error',

      // ── 规范 3.5.3：分页 API 返回值必须解构 .list ──────────
      'minis/require-pagination-list-destructure': 'error',

      // ── 规范 3.5.7：a-badge status 不能用 "default" ────────
      'minis/no-badge-invalid-status': 'error',

      // ── 规范 3.5.8：a-range-picker placeholder 必须是数组 ──
      'minis/no-range-picker-string-placeholder': 'error',

      // ── 规范 3.5.9：禁止使用不存在的 Arco Design 图标 ──────
      'minis/no-invalid-arco-icon': 'error',
    },
  },
]
