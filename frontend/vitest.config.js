import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    css: true,
    include: ['test/**/*.test.{js,jsx}'],
    exclude: ['test/e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'test/e2e/',
        '**/*.config.js',
        'dist/',
      ],
    },
  },
});