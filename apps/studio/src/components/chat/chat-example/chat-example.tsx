import { Skeleton } from '@temp-repo/ui/components/skeleton'
import { ConnectionStatus } from './connection-status'
import { GuestNotice } from './guest-notice'
import { ImplementationInfo } from './implementation-info'
import { CHAT_PAGE_DESCRIPTION, CHAT_PAGE_TITLE, useChatExample } from './lib'
import { MembersList } from './members-list'
import { MessageList } from './message-list'
import { SendMessageForm } from './send-message-form'

export function ChatExample() {
  const chat = useChatExample()

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{CHAT_PAGE_TITLE}</h1>
        <p className="text-muted-foreground">{CHAT_PAGE_DESCRIPTION}</p>
      </div>

      {chat.isSessionPending ? (
        <Skeleton className="h-96 w-full" />
      ) : chat.currentUser ? (
        <>
          <ConnectionStatus status={chat.connectionStatus} userName={chat.currentUser.name} />
          <MembersList members={chat.members} />
          <MessageList
            messages={chat.messages}
            isLoading={chat.isLoading}
            currentUserId={chat.currentUser.id}
          />
          <SendMessageForm onSend={chat.send} isPending={chat.isSending} error={chat.sendError} />
        </>
      ) : (
        <GuestNotice />
      )}

      <ImplementationInfo />
    </div>
  )
}
