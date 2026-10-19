import { defineConfig } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => ({
  // Relative asset paths, so the build works under GitHub Pages' /flappy-bird/ path.
  base: './',
  // Phones only expose motion sensors and the microphone to https pages.
  plugins: mode === 'phone' ? [basicSsl()] : [],
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
