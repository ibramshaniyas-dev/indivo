import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: these rarely change, so browsers keep them cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui/icons-material')) return 'vendor-icons';
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
          // React, router, redux, axios and their small helpers share one chunk (they import each other).
          return 'vendor';
        },
      },
    },
  },
});
