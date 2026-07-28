import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tell Vite to look inside the src folder for index.html
  root: './src', 
  build: {
    // Ensure the output still goes to the right dist folder
    outDir: '../dist', 
    emptyOutDir: true
  }
});