export type RealtimeUser = {
  id: string
  name: string
}

export type RealtimeContext = {
  user: RealtimeUser | null
}
