import * as Bun from 'bun'
import { resolve, sep } from 'node:path'
const directory = resolve(import.meta.dir, '../dist')
const server = Bun.serve({
	hostname: '127.0.0.1',
	port: 8083,
	async fetch(request) {
		let path: string
		try {
			path = decodeURIComponent(new URL(request.url).pathname)
		} catch {
			return new Response('Invalid URL', { status: 400 })
		}
		const absolute = resolve(directory, `.${path}`)
		if (absolute !== directory && !absolute.startsWith(directory + sep)) {
			return new Response('Not found', { status: 404 })
		}
		let file = Bun.file(absolute)
		if (absolute === directory || !(await file.exists())) {
			if (path.startsWith('/_expo/') || path.startsWith('/assets/') || path === '/sw.js') {
				return new Response('Not found', { status: 404 })
			}
			file = Bun.file(resolve(directory, 'index.html'))
		}
		return new Response(file, {
			headers: { 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' }
		})
	}
})
console.info(`Exported prototype: ${server.url}`)
