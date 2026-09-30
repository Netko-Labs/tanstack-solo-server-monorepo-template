import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface RoomState {
  /** `${roomId}:${userId}` the state belongs to; a different identity renders as empty. */
  identity: string
  /** This tab's presence record, from the last sync; needed to report status. */
  connectionId?: string
  messages: ChatMessage[]
  members: Member[]
  connectionStatus: ConnectionStatus
}

export type RoomAction =
  | { type: 'reset'; identity: string; connectionStatus: ConnectionStatus }
  | { type: 'status'; connectionStatus: ConnectionStatus }
  | { type: 'event'; event: RoomEvent }

export interface ConnectionStatusProps {
  status: ConnectionStatus
  userName?: string
}

export interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  currentUserId?: string
}

export interface StatusReporterState {
  inFlight: boolean
  cancelled: boolean
  latest?: Member['status']
  sent?: Member['status']
}

export interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export interface SendMessageFormProps {
  onSend: (content: string) => Promise<boolean>
  isPending: boolean
  error?: string
}

export interface MembersListProps {
  members: Member[]
}
