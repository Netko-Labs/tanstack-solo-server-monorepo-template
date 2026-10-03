type IngestHit = {
  path: string
  search: string
  contentType: string | null
  key: string | null
  body: string
}

export function createIngestSink(port: number) {
  const hits: IngestHit[] = []
  const server = Bun.serve({
    port,
    async fetch(request) {
      const url = new URL(request.url)
      let bytes = new Uint8Array(await request.arrayBuffer())
      if (request.headers.get('content-encoding') === 'gzip') bytes = Bun.gunzipSync(bytes)
      hits.push({
        path: url.pathname,
        search: url.search,
        contentType: request.headers.get('content-type'),
        key: request.headers.get('x-codewhiskers-key'),
        body: new TextDecoder().decode(bytes),
      })
      return Response.json({ id: 'ok' })
    },
  })
  return { hits, stop: () => server.stop(true) }
}
