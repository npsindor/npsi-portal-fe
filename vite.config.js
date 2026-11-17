import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// `import ADS from 'virtual:advertising'`: the image files in public/advertising (e.g. ['/advertising/ad1.jpg']),
// sorted by name with numbers in order. Dropping a file in the folder adds it (dev reloads; production on the next build).
const ADS_DIR = path.resolve(__dirname, 'public/advertising');
const ADS_ID = 'virtual:advertising';
function advertisingFolder() {
  const list = () => {
    try {
      return fs.readdirSync(ADS_DIR)
        .filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
        .map((name) => `/advertising/${encodeURIComponent(name)}`);
    } catch {
      return [];
    }
  };
  return {
    name: 'advertising-folder',
    resolveId: (id) => (id === ADS_ID ? `\0${ADS_ID}` : null),
    load: (id) => (id === `\0${ADS_ID}` ? `export default ${JSON.stringify(list())};` : null),
    configureServer(server) {
      server.watcher.add(ADS_DIR);
      const changed = (file) => {
        if (!file.startsWith(ADS_DIR)) return;
        const mod = server.moduleGraph.getModuleById(`\0${ADS_ID}`);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', changed);
      server.watcher.on('unlink', changed);
    },
  };
}

export default defineConfig({
  plugins: [react(), advertisingFolder()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
