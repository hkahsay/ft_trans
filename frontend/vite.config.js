import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: [/node_modules\/core-js\//],
      }),
  ],
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
});
