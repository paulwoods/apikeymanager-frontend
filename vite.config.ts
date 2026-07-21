import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // Proxied so the API is same-origin to the browser: the backend's httpOnly
      // session cookie is then stored and returned without cross-origin rules applying.
      // Revisit changeOrigin when Keycloak lands — OIDC redirect URIs are sensitive to
      // the Host header.
      '/api': { target: 'http://localhost:8080' },
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
