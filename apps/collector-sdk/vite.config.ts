import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IssueCollector',
      fileName: (format) => `collector.${format === 'umd' ? 'min' : format}.js`,
      formats: ['umd'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Ensure UMD format works in browser
        format: 'umd',
        name: 'IssueCollector',
        // Inline all dependencies for single-file bundle
        inlineDynamicImports: true,
      },
    },
    target: 'es2020',
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
})

