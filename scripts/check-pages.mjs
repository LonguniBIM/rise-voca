/** Validate the publishing directory and optionally its deployed HTTPS bytes. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const required = ['index.html', 'BUILD_INFO.json', 'manifest.webmanifest', 'sw.js',
  'offline-manifest.json', 'data/library.json', 'data/illustrations.json',
  'data/weeks/index.json', 'src/app.js', 'src/core.js', 'src/store.js',
  'src/speech.js', 'src/styles.css', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/apple-touch-icon.png'];
export function checkDirectory(directory) {
  const root = path.resolve(directory);
  const read = name => {
    if (!fs.existsSync(path.join(root, name))) throw new Error(
      `Publishing directory is incomplete: ${name}. Publish built dist/, not the repository root.`);
    return fs.readFileSync(path.join(root, name));
  };
  required.forEach(read);
  const json = name => JSON.parse(read(name));
  const build = json('BUILD_INFO.json'), offline = json('offline-manifest.json');
  const library = json('data/library.json'), registry = json('data/illustrations.json');
  if (offline.version !== build.version) throw new Error('Offline/build version mismatch');
  if (!library.fingerprint || library.fingerprint !== build.libraryFingerprint ||
      registry.fingerprint !== build.illustrationFingerprint)
    throw new Error('Source catalogs were published instead of generated catalogs');
  const paths = new Set();
  for (const entry of offline.files) {
    if (!/^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(entry.path) ||
        entry.path.split('/').includes('..') || paths.has(entry.path))
      throw new Error('Unsafe or duplicate cache path: ' + entry.path);
    paths.add(entry.path);
    if (hash(read(entry.path)) !== entry.sha256) throw new Error('Asset hash mismatch: ' + entry.path);
  }
  for (const name of required.filter(name => !['sw.js', 'offline-manifest.json'].includes(name)))
    if (!paths.has(name)) throw new Error('Runtime asset missing from offline pack: ' + name);
  if (paths.has('.nojekyll')) throw new Error('Deployment marker must not be an offline dependency');
  if (!fs.existsSync(path.join(root, '.nojekyll'))) throw new Error('Missing deployment marker');
  const manifest = json('manifest.webmanifest');
  if (manifest.id !== './' || manifest.start_url !== './' || manifest.scope !== './')
    throw new Error('Application identity/scope must remain project-relative');
  const weeks = json('data/weeks/index.json');
  for (const week of weeks) {
    const name = 'data/weeks/' + week.id + '.json';
    if (!paths.has(name)) throw new Error('Weekly pack is not cached: ' + name);
    const pack = json(name);
    if (pack.libraryFingerprint !== library.fingerprint) throw new Error('Stale weekly pack: ' + name);
  }
  const html = read('index.html').toString();
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
    if (match[1] !== './') read(match[1].slice(2));
  }
  const worker = read('sw.js').toString();
  if (worker.includes('__VERSION__') || worker.includes('__FILES__')) throw new Error('Unbuilt service worker');
  if (!worker.includes(JSON.stringify(build.version))) throw new Error('Stale service worker version');
  for (const entry of offline.files)
    if (!worker.includes(JSON.stringify(entry.sha256))) throw new Error('Worker manifest is stale');
  return {root, version: build.version, files: [...new Set([...paths, ...required])]};
}
export async function checkLive(directory, baseAddress) {
  const local = checkDirectory(directory), base = new URL(baseAddress);
  if (base.protocol !== 'https:' || !base.pathname.endsWith('/'))
    throw new Error('Expected an HTTPS site URL ending in /');
  // Retry only the build marker while the Pages CDN receives the new release.
  let ready = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await fetch(new URL('BUILD_INFO.json', base),
        {cache: 'no-store', signal: AbortSignal.timeout(15000)});
      ready = response.ok && (await response.json()).version === local.version;
    } catch { /* bounded propagation wait */ }
    if (ready) break;
    if (attempt < 11) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (!ready) throw new Error('The published build is missing or not the expected version: ' + local.version);
  for (const name of ['', ...local.files]) {
    const response = await fetch(new URL(name, base),
      {cache: 'no-store', signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`Published asset failed: ${name || '/'} (${response.status})`);
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = fs.readFileSync(path.join(local.root, name || 'index.html'));
    if (hash(actual) !== hash(expected)) throw new Error('Published asset differs from validated build: ' + name);
    const mime = response.headers.get('content-type') || '';
    if (name.endsWith('.js') && !/(javascript|ecmascript)/i.test(mime)) throw new Error('Invalid JavaScript MIME: ' + name);
  }
  return {version: local.version, verifiedFiles: local.files.length + 1, url: base.href};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv.includes('--directory') ? process.argv[process.argv.indexOf('--directory') + 1] : 'dist';
  const index = process.argv.indexOf('--url');
  try { console.log(JSON.stringify(index >= 0 ? await checkLive(root, process.argv[index + 1]) : checkDirectory(root), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
