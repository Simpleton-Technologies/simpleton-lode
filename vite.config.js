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
  server: {
    port: 5173,
    proxy: {
      // Proxy /api/* to the Lode server during dev
      '/api': {
        target: 'http://localhost:3033',
        changeOrigin: true,
      },
    },
  },
});
