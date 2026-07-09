import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // This animation engine intentionally coordinates imperative rAF/DOM work
    // with refs and uses client-mount effects for browser-only preferences.
    // Keep the standard hooks rules, but disable React Compiler diagnostics
    // that require a different architecture than this prototype currently uses.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**']),
])
