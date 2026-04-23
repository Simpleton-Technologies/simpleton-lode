/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Include .js files in JSX transform (index.js uses React.createElement
      // but this keeps the door open for other .js UI modules).
      include: /\.(js|jsx|ts|tsx)$/,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  // @loderuntime/core is a CJS package consumed via a file: symlink outside
  // this project root. Vite's raw ?import shim does not transform top-level
  // require() calls — only esbuild pre-bundling does. Force it into the
  // optimizer so require('js-sha256') et al. become proper ESM imports the
  // browser can execute.
  optimizeDeps: {
    include: ['@loderuntime/core'],
  },
  server: {
    port: 5173,
    // The linked package lives at ../../../LodeRuntime relative to this
    // project. Vite's dev server refuses to serve outside the project root
    // by default — whitelist the LodeRuntime tree so /@fs/... resolves.
    fs: {
      allow: [
        path.resolve(process.cwd(), '.'),
        path.resolve(process.cwd(), '../../../LodeRuntime'),
      ],
    },
    proxy: {
      // Proxy /api/* to the Lode server during dev
      '/api': {
        target: 'http://localhost:3033',
        changeOrigin: true,
      },
    },
  },
});
