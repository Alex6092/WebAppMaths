import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  // Chemins relatifs : l'app fonctionne sous n'importe quel sous-chemin du reverse proxy.
  base: './',
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
  build: { target: 'es2022', sourcemap: true },
});
