import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'tests/e2e/**', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/font/google': path.resolve(__dirname, './tests/__mocks__/next-font-google.ts'),
      'next/font/local': path.resolve(__dirname, './tests/__mocks__/next-font-local.ts'),
    },
  },
})
