// Variante d'exécution de la suite existante quand Chrome ne peut pas joindre
// localhost. Les mêmes fichiers sont servis par Playwright, sans changer
// l'application ni les assertions. Supprimer le fichier temporaire après usage.
import { readFile, writeFile } from 'node:fs/promises';
const source = new URL('../exportBrowser.test.mjs', import.meta.url);
let code = await readFile(source, 'utf8');
code = code.replace("context.route('**/*', route => {", "context.route('**/*', async route => {");
code = code.replace('return route.continue();', `
  const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
  const file = resolve(root, pathname.slice(prefix.length));
  assert.ok(file.startsWith(root + '\\\\') || file.startsWith(root + '/'));
  const types = { '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.woff':'font/woff', '.svg':'image/svg+xml' };
  try { return await route.fulfill({ body: await readFile(file), contentType: types[extname(file)] || 'application/octet-stream' }); }
  catch { return route.fulfill({ status: 404 }); }
`);
code = code.replaceAll('route.continue()', 'route.fallback()');
await writeFile(new URL('../exportBrowser.routed.mjs', import.meta.url), code);
