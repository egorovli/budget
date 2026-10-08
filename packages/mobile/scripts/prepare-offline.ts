import { readdir } from 'node:fs/promises'
import * as Bun from 'bun'
import { join, relative } from 'node:path'
const directory = join(import.meta.dir, '../dist')
const files = await readdir(directory, { recursive: true, withFileTypes: true })
const assets: string[] = []
const hash = new Bun.CryptoHasher('sha256')
hash.update(await Bun.file(import.meta.path).text())
for (const entry of files
	.filter(fileEntry => fileEntry.isFile())
	.sort((a, b) => a.name.localeCompare(b.name))) {
	const path = relative(directory, join(entry.parentPath, entry.name))
	if (path === 'sw.js' || path === 'metadata.json') {
		continue
	}
	hash.update(path)
	hash.update(await Bun.file(join(directory, path)).arrayBuffer())
	assets.push(`/${path}`)
}
const version = hash.digest('hex').slice(0, 16)
const cacheName = `budgetly-shell-${version}`
const worker = `const CACHE = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('message', event => { if (event.data === 'activate') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('budgetly-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
 if (event.request.mode === 'navigate') { event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')).then(response => response || fetch(event.request))); return; }
 if (ASSETS.includes(url.pathname)) event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(response => response || fetch(event.request)));
});`
await Bun.write(join(directory, 'sw.js'), worker)
const index = Bun.file(join(directory, 'index.html'))
const registration = `<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('Offline shell unavailable',error));}</script>`
await Bun.write(index, (await index.text()).replace('</body>', `${registration}</body>`))
console.info(`Prepared ${cacheName}: ${assets.length} local assets.`)
