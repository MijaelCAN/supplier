import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        // manualChunks removido: causaba TDZ errors al separar @heroui de sus dependencias
        // (framer-motion, @internationalized/date, react-aria, etc.)
        // El code splitting ya está cubierto por React.lazy() en las rutas.
      },
    },
  },
  server: {
    port: 5173,
    host: true
  }
})
