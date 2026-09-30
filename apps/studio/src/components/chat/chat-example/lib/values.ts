export const CHAT_PAGE_TITLE = 'Chat Example'
export const CHAT_PAGE_DESCRIPTION = 'Real-time global chat over a tRPC WebSocket subscription'

export const CONNECTION_CONNECTED = 'Connected'
export const CONNECTION_CONNECTING = 'Connecting...'
export const CONNECTION_DISCONNECTED = 'Disconnected'
export const CONNECTION_LOGGED_IN_PREFIX = 'Logged in as'

export const MESSAGES_TITLE = 'Messages'
export const MESSAGES_LOADING = 'Loading messages...'
export const MESSAGES_EMPTY = 'No messages yet. Be the first to say something!'

export const SEND_PLACEHOLDER = 'Type a message...'
export const SEND_LABEL = 'Send'
export const SEND_PENDING_LABEL = 'Sending...'

export const MEMBERS_TITLE = 'Online'
export const MEMBERS_EMPTY = 'Connecting to the room...'

export const GUEST_MESSAGE = 'Sign in to join the room and see who is here.'
export const GUEST_CTA = 'Sign in'

export const IMPLEMENTATION_TITLE = 'Implementation Details'
export const IMPLEMENTATION_WS =
  'Presence + messages stream over one wsLink subscription to /trpc-ws: subscribe = join, disconnect = leave.'
export const IMPLEMENTATION_AUTH =
  'The room is protected: history, presence and sending all require a session.'
export const IMPLEMENTATION_HINT =
  'Try opening this page in multiple browser windows to see real-time updates!'
