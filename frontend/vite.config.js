import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load REACT_APP_* env vars (CRA convention) so existing code using
  // process.env.REACT_APP_* keeps working without changes.
  const env = loadEnv(mode, path.resolve(__dirname), 'REACT_APP_');

  const processEnv = Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
  );

  return {
    plugins: [react()],
    define: {
      ...processEnv,
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      // Required so the Emergent preview proxy and Vercel previews can reach the dev server.
      allowedHosts: true,
      hmr: { clientPort: 443 },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    build: {
      // Match CRA's default output folder so existing Vercel/CI configs keep working.
      outDir: 'build',
      sourcemap: false,
    },
  };
});
