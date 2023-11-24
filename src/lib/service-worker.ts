/// <reference lib="webworker" />

const CACHE_NAME = 'segment-cache-v1';

const shouldCache = (url: string) => {
	return url.endsWith('.mp4') || url.endsWith('.m4s') || url.endsWith('.ts');
};

const cacheResponse = (cache: Cache, request: Request, response: Response) => {
	const init: {
		status: number;
		statusText: string;
		headers: {
			[key: string]: string;
		};
	} = {
		status: response.status,
		statusText: response.statusText,
		headers: { 'X-Shaka-From-Cache': String(true) }
	};

	response.headers.forEach((value, key) => {
		init.headers[key] = value;
	});

	return response
		.clone()
		.arrayBuffer()
		.then((buffers) => {
			cache.put(request, new Response(buffers, init));
		});
};

const loadFromCacheOrFetch = (request: Request) => {
	return caches.open(CACHE_NAME).then((cache) => {
		return cache.match(request).then((response) => {
			if (response) {
				console.log('Handling cached request', request.url);
				return response;
			}
			return fetch(request).then((response) => {
				if (response.ok && response.status !== 206 && shouldCache(request.url)) {
					console.log('Caching MP4 segment', request.url);
					cacheResponse(cache, request, response);
				}

				return response;
			});
		});
	});
};

const worker = self as unknown as ServiceWorkerGlobalScope;

worker.addEventListener('fetch', (event) => {
	event.respondWith(loadFromCacheOrFetch(event.request));
});
