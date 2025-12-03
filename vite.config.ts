import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Configuración para producción
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Asegurar que las variables de entorno se incluyan correctamente
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true
  }
})
