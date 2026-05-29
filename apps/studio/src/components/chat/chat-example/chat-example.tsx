import { ConnectionStatus } from './connection-status/connection-status'
import { CHAT_PAGE_DESCRIPTION, CHAT_PAGE_TITLE } from './definitions'
import { ImplementationInfo } from './implementation-info/implementation-info'
import { MessageList } from './message-list/message-list'
import { GuestNotice, SendMessageForm } from './send-message-form/send-message-form'
import { useChatExample } from './use-chat-example'

export function ChatExample() {
  const {
    currentUser,
    messages,
    isLoading,
    connectionStatus,
    messagesEndRef,
    sendMutation,
    handleSendMessage,
  } = useChatExample()

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{CHAT_PAGE_TITLE}</h1>
        <p className="text-muted-foreground">{CHAT_PAGE_DESCRIPTION}</p>
      </div>

      <ConnectionStatus status={connectionStatus} userName={currentUser?.name} />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        currentUserId={currentUser?.id}
        messagesEndRef={messagesEndRef}
      />

      {currentUser ? (
        <SendMessageForm onSubmit={handleSendMessage} isPending={sendMutation.isPending} />
      ) : (
        <GuestNotice />
      )}

      <ImplementationInfo />
    </div>
  )
}
