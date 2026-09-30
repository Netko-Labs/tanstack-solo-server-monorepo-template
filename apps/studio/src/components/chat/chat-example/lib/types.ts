import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import type { FormEvent, RefObject } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface RoomState {
  /** `${roomId}:${userId}` the state belongs to; a different identity renders as empty. */
  identity: string
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
  messagesEndRef: RefObject<HTMLDivElement | null>
}

export interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export interface SendMessageFormProps {
  onSubmit: (e: FormEvent, content: string) => void
  isPending: boolean
}

export interface MembersListProps {
  members: Member[]
}
