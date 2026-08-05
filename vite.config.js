import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Ajusta la raíz de Vite al directorio principal del proyecto (Sueño Travel)
  // Esto permite resolver "../style.css" y "../crm-config.js" correctamente
  root: path.resolve(__dirname, '../'),
  
  resolve: {
    alias: {
      // Mapea la resolución de React y sus utilidades a la carpeta node_modules del submódulo
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
    }
  },

  // Especifica que el servidor busque el index.html de controlpanel
  server: {
    open: '/controlpanel/index.html',
  },

  build: {
    // Guarda la compilación de producción en controlpanel/dist/
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Indica el punto de entrada index.html real
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
