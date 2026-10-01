export type TrpcProbes = {
  protectedQuery: string
  publicQuery: string
  guardedStream?: string
  streamInput?: unknown
}

export type HealthBody = { checks?: { database?: string; cache?: string } }

export type WireRequest = {
  id: number
  method: 'query' | 'subscription'
  params: { path: string; input: { json: unknown } }
}
