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
        manualChunks: (id) => {
          // Firebase: no usa React en absoluto → puede ir solo sin riesgo de TDZ
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // recharts/d3: solo se cargan desde páginas lazy (reportes)
          // Para cuando se cargan, vendor (con React) ya está inicializado → sin TDZ
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts';
          }
          // react-pdf: igual, solo en páginas lazy
          if (id.includes('node_modules/@react-pdf')) {
            return 'vendor-pdf';
          }
          // TODO lo demás (React + HeroUI + framer-motion + react-aria + misc)
          // va junto en un solo chunk para evitar cualquier problema de inicialización cruzada
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true
  }
})
