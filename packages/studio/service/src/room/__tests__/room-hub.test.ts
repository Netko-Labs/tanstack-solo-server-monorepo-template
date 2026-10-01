// conventions: >300 lines — one RoomHub lifecycle suite over shared fixtures; split when next touched
import { describe, expect, test } from 'bun:test'
import type { ChatMessage, Member, RoomEvent } from '@temp-repo/studio-domain'
import { LocalRoomBus } from '../local'
import { RoomHub } from '../room-hub'
import type { RoomBus } from '../types'

/** LocalRoomBus with a reconnect signal the test can fire. */
class ReconnectableBus extends LocalRoomBus implements RoomBus {
  private readonly reconnectListeners = new Set<() => void>()
  override onReconnect(listener: () => void): () => void {
    this.reconnectListeners.add(listener)
    return () => this.reconnectListeners.delete(listener)
  }
  fireReconnect(): void {
    for (const listener of this.reconnectListeners) listener()
  }
}

const member = (userId: string): Member => ({ userId, name: userId, status: 'active' })
const message: ChatMessage = {
  id: crypto.randomUUID(),
  roomId: 'lobby',
  content: 'hi',
  authorId: 'a',
  authorName: 'a',
  createdAt: new Date(),
}

// `for await` + break would call return() and tear the stream down (finally → leave).
async function take(stream: AsyncGenerator<RoomEvent>, count: number): Promise<RoomEvent[]> {
  const events: RoomEvent[] = []
  while (events.length < count) {
    const next = await stream.next()
    if (next.done) break
    events.push(next.value)
  }
  return events
}

describe('RoomHub over LocalRoomBus', () => {
  test('sync first (own join is not echoed), then chat fan-out', async () => {
    const hub = new RoomHub(new LocalRoomBus(), async () => [message])
    const stream = hub.stream('lobby', member('a'))
    const [sync] = await take(stream, 1)
    expect(sync?.type).toBe('sync')
    if (sync?.type !== 'sync') throw new Error('unreachable')
    expect(sync.members.map((m) => m.userId)).toEqual(['a'])
    expect(sync.messages).toEqual([message])

    const live = { ...message, id: crypto.randomUUID(), content: 'live' }
    const next = take(stream, 1)
    await hub.chat('lobby', live)
    expect(await next).toEqual([{ type: 'chat', message: live }])
    await stream.return(undefined)
  })

  test('two members see each other; leaving fans out and clears presence', async () => {
    const hub = new RoomHub(new LocalRoomBus(), async () => [])
    const a = hub.stream('lobby', member('a'))
    await take(a, 1)

    const controller = new AbortController()
    const b = hub.stream('lobby', member('b'), controller.signal)
    const [syncB] = await take(b, 1)
    if (syncB?.type !== 'sync') throw new Error('unreachable')
    expect(syncB.members.map((m) => m.userId).sort()).toEqual(['a', 'b'])

    const joinSeenByA = await take(a, 1)
    expect(joinSeenByA[0]).toEqual({ type: 'join', member: member('b') })

    const leaveSeenByA = take(a, 1)
    controller.abort()
    await b.return(undefined)
    expect(await leaveSeenByA).toEqual([{ type: 'leave', userId: 'b' }])
    expect((await hub.members('lobby')).map((m) => m.userId)).toEqual(['a'])
    await a.return(undefined)
  })

  test('same user, two connections: presence survives the first leave, drops on the last', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => [])
    const seen: RoomEvent[] = []
    await bus.subscribe('lobby', (event) => seen.push(event))

    const first = hub.stream('lobby', member('a'))
    await take(first, 1)
    const second = hub.stream('lobby', member('a'))
    await take(second, 1)
    expect(seen.filter((e) => e.type === 'join')).toHaveLength(1)

    await second.return(undefined)
    expect(seen.some((e) => e.type === 'leave')).toBe(false)
    expect((await hub.members('lobby')).map((m) => m.userId)).toEqual(['a'])

    await first.return(undefined)
    expect(seen.at(-1)).toEqual({ type: 'leave', userId: 'a' })
    expect(await hub.members('lobby')).toEqual([])
  })

  test('a chat published while history loads is not delivered twice', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => {
      await bus.publish('lobby', { type: 'chat', message })
      return [message]
    })
    const stream = hub.stream('lobby', member('a'))
    const [sync] = await take(stream, 1)
    if (sync?.type !== 'sync') throw new Error('unreachable')
    expect(sync.messages).toEqual([message])

    const later = { ...message, id: crypto.randomUUID(), content: 'after' }
    const next = take(stream, 1)
    await hub.chat('lobby', later)
    expect(await next).toEqual([{ type: 'chat', message: later }])
    await stream.return(undefined)
  })

  test('a failed subscribe rejects the stream and leaves nothing for drain to wait on', async () => {
    class DeafBus extends LocalRoomBus {
      override subscribe(): Promise<() => void> {
        return Promise.reject(new Error('bus down'))
      }
    }
    const hub = new RoomHub(new DeafBus(), async () => [])
    await expect(hub.stream('lobby', member('a')).next()).rejects.toThrow('bus down')
    const started = Date.now()
    await hub.drain(1000)
    expect(Date.now() - started).toBeLessThan(100)
    expect(await hub.members('lobby')).toEqual([])
  })

  test('an already-aborted signal ends the stream before it joins', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => [])
    const joins: string[] = []
    await bus.subscribe('lobby', (event) => {
      if (event.type === 'join') joins.push(event.member.userId)
    })
    const stream = hub.stream('lobby', member('a'), AbortSignal.abort())
    expect((await stream.next()).done).toBe(true)
    expect(joins).toEqual([])
    expect(await hub.members('lobby')).toEqual([])
  })

  test('abort while history loads yields no sync and leaves the room', async () => {
    const bus = new LocalRoomBus()
    const controller = new AbortController()
    const hub = new RoomHub(bus, async () => {
      controller.abort()
      return []
    })
    const stream = hub.stream('lobby', member('a'), controller.signal)
    const first = await stream.next()
    expect(first.done).toBe(true)
    expect(await hub.members('lobby')).toEqual([])
  })

  test('a join that lands before the snapshot is not replayed after it', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => {
      await hub.bus.join('lobby', 'other', member('b'))
      return []
    })
    const stream = hub.stream('lobby', member('a'))
    const [sync] = await take(stream, 1)
    if (sync?.type !== 'sync') throw new Error('unreachable')
    expect(sync.members.map((m) => m.userId).sort()).toEqual(['a', 'b'])

    const live = { ...message, id: crypto.randomUUID() }
    const next = take(stream, 1)
    await hub.chat('lobby', live)
    expect(await next).toEqual([{ type: 'chat', message: live }])
    await stream.return(undefined)
  })

  test('status is per connection: a hidden tab does not idle a visible one', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => [])
    const hidden = hub.stream('lobby', member('a'))
    const [syncHidden] = await take(hidden, 1)
    const visible = hub.stream('lobby', member('a'))
    await take(visible, 1)
    if (syncHidden?.type !== 'sync') throw new Error('unreachable')

    expect(await hub.setStatus('lobby', syncHidden.connectionId, 'someone-else', 'idle')).toBe(
      false,
    )
    const next = take(hidden, 1)
    expect(await hub.setStatus('lobby', syncHidden.connectionId, 'a', 'idle')).toBe(true)
    const [presence] = await next
    if (presence?.type !== 'presence') throw new Error('unreachable')
    expect(presence.members).toEqual([member('a')])

    await visible.return(undefined)
    expect((await hub.members('lobby'))[0]?.status).toBe('idle')
    await hidden.return(undefined)
  })

  test('a transport reconnect pushes a fresh sync', async () => {
    const bus = new ReconnectableBus()
    const history = [message]
    const hub = new RoomHub(bus, async () => history)
    const stream = hub.stream('lobby', member('a'))
    await take(stream, 1)

    history.push({ ...message, id: crypto.randomUUID(), content: 'missed during outage' })
    const next = take(stream, 1)
    bus.fireReconnect()
    const [resync] = await next
    if (resync?.type !== 'sync') throw new Error('unreachable')
    expect(resync.messages).toHaveLength(2)
    await stream.return(undefined)
  })

  test('a chat published while the resync snapshot loads arrives once, after the sync', async () => {
    const bus = new ReconnectableBus()
    const late = { ...message, id: crypto.randomUUID(), content: 'during resync' }
    let loads = 0
    const hub = new RoomHub(bus, async () => {
      loads += 1
      if (loads === 2) await bus.publish('lobby', { type: 'chat', message: late })
      return [message]
    })
    const stream = hub.stream('lobby', member('a'))
    await take(stream, 1)

    const next = take(stream, 2)
    bus.fireReconnect()
    const [resync, chat] = await next
    expect(resync?.type).toBe('sync')
    expect(chat).toEqual({ type: 'chat', message: late })
    await stream.return(undefined)
  })

  test('a chat already in the snapshot is suppressed even when its notification trails', async () => {
    const bus = new LocalRoomBus()
    const hub = new RoomHub(bus, async () => [message])
    const stream = hub.stream('lobby', member('a'))
    await take(stream, 1)

    const fresh = { ...message, id: crypto.randomUUID(), content: 'fresh' }
    const next = take(stream, 1)
    await bus.publish('lobby', { type: 'chat', message })
    await bus.publish('lobby', { type: 'chat', message: fresh })
    expect(await next).toEqual([{ type: 'chat', message: fresh }])
    await stream.return(undefined)
  })

  test('a member whose instance died vanishes within one heartbeat interval', async () => {
    // A dead instance publishes nothing: its records just stop being live.
    class GhostBus extends LocalRoomBus {
      vanish(roomId: string, connectionId: string) {
        this.presence.get(roomId)?.delete(connectionId)
      }
    }
    const bus = new GhostBus()
    const hub = new RoomHub(bus, async () => [], 20)
    await bus.join('lobby', 'ghost', member('ghost'))
    const stream = hub.stream('lobby', member('a'))
    const [sync] = await take(stream, 1)
    if (sync?.type !== 'sync') throw new Error('unreachable')
    expect(sync.members.map((m) => m.userId).sort()).toEqual(['a', 'ghost'])

    bus.vanish('lobby', 'ghost')
    const [presence] = await take(stream, 1)
    expect(presence).toEqual({ type: 'presence', members: [member('a')] })
    await stream.return(undefined)
  })

  test('a slow heartbeat cannot land after the leave', async () => {
    let heartbeatDone = false
    class SlowBus extends LocalRoomBus {
      override async heartbeat(roomId: string, connectionId: string, m: Member) {
        await Bun.sleep(80)
        await super.heartbeat(roomId, connectionId, m)
        heartbeatDone = true
      }
    }
    const bus = new SlowBus()
    const hub = new RoomHub(bus, async () => [], 20)
    const stream = hub.stream('lobby', member('a'))
    await take(stream, 1)
    await Bun.sleep(40)
    await stream.return(undefined)
    expect(heartbeatDone).toBe(true)
    expect(await bus.members('lobby')).toEqual([])
  })

  test('the bus is one per process while the hub is rebuilt per module evaluation', async () => {
    const load = (query: string) =>
      import(`../room-hub.ts?${query}`) as Promise<typeof import('../room-hub')>
    const first = await load('eval=1')
    const second = await load('eval=2')
    expect(first.hub).not.toBe(second.hub)
    expect(first.hub.bus).toBe(second.hub.bus)
  })

  test('abort ends the stream without a pending poll', async () => {
    const hub = new RoomHub(new LocalRoomBus(), async () => [])
    const controller = new AbortController()
    const stream = hub.stream('lobby', member('a'), controller.signal)
    await take(stream, 1)
    controller.abort()
    const done = await stream.next()
    expect(done.done).toBe(true)
    expect(await hub.members('lobby')).toEqual([])
  })
})
