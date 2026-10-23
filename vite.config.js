import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Serve and ship the canonical project license without a second editable copy.
const license = readFileSync(new URL('./LICENSE', import.meta.url), 'utf8');
export default defineConfig({
  base: './',
  plugins: [{
    name: 'project-license',
    configureServer(server) {
      server.middlewares.use('/LICENSE.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(license);
      });
    },
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'LICENSE.txt', source: license }); },
  }],
  build: { chunkSizeWarningLimit: 1500 },
});
