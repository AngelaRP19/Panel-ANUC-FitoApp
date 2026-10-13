import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'public', 'src/types/api.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Dirección de dependencias: pages → features → components / services / hooks
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features/*', '@/pages/*'], message: 'components/ es UI genérica: no importa de features/ ni pages/.' }] },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/pages/*'], message: 'features/ no importa de pages/.' }, { group: ['@/features/*/*'], message: 'Usa la API pública del feature (@/features/<nombre>).' }] },
      ],
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['axios', '@/services/apiClient'], message: 'Las páginas no llaman a Axios: usa los hooks del feature.' }, { group: ['@/features/*/*'], message: 'Usa la API pública del feature (@/features/<nombre>).' }] },
      ],
    },
  },
  prettier,
])
