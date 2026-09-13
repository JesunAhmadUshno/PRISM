import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * PRISM Vite Configuration
 * 
 * Security-Focused Build Configuration:
 * - Strict CSP compatibility
 * - Subresource Integrity (SRI) for production
 * - No inline scripts/styles where avoidable
 * - Web Worker support for Pyodide isolation
 */
export default defineConfig({
  plugins: [
    react({
      // Use the new JSX transform for smaller bundles
      jsxRuntime: 'automatic',
    }),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@workers': resolve(__dirname, 'src/workers'),
      '@security': resolve(__dirname, 'src/security'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // GitHub Pages deployment base (repo name)
  // The marketing site now occupies the repository root on Pages, so the
  // application is served one level down at /PRISM/app/. Everything that builds
  // a runtime URL reads import.meta.env.BASE_URL rather than hardcoding this,
  // including the vendored SheetJS loader, so moving the app is a one line change.
  base: '/PRISM/app/',

  build: {
    // Target modern browsers for smaller bundles
    target: 'es2022',
    
    // Output directory for GitHub Pages
    outDir: 'dist',
    
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: false,
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
      },
    },

    rollupOptions: {
      output: {
        // Chunk splitting for optimal caching.
        //
        // Must be a FUNCTION, not the object form: Vite 8 bundles with rolldown
        // rather than rollup, and rolldown rejects the object with
        // "manualChunks is not a function".
        //
        // Matching on the resolved module id also fixes what the object form got
        // wrong. The automatic JSX transform means components import
        // react/jsx-runtime rather than react, so an entry listing only 'react'
        // and 'react-dom' matched almost nothing and emitted a 37-byte chunk
        // while React itself stayed in the entry bundle.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/]react(-dom)?[\\/]/.test(id)) return 'vendor-react';
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) return 'vendor-charts';
          if (/[\\/]node_modules[\\/](zustand|dompurify)[\\/]/.test(id)) return 'vendor-utils';
          return undefined;
        },
        
        // Asset naming for cache busting
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    
    // Warn on large chunks
    chunkSizeWarningLimit: 500,
  },

  worker: {
    // Web Worker format - required for Pyodide
    format: 'es',
    plugins: () => [react()],
  },

  server: {
    port: 3000,
    strictPort: true,
    headers: {
      // Development CSP - slightly relaxed for HMR
      'Content-Security-Policy': [
        "default-src 'none'",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net/pyodide/",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://cdn.jsdelivr.net/pyodide/ ws://localhost:*",
        "worker-src 'self' blob:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ].join('; '),
      
      // Additional security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    },
  },

  preview: {
    port: 4173,
    strictPort: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'recharts', 'dompurify'],
    exclude: ['pyodide'], // Pyodide loaded dynamically
  },
});
