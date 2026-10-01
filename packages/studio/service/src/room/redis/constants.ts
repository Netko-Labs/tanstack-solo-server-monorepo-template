// Alive keys are addressed by prefix inside the scripts (fine on a single node; cluster
// mode would want them hashed into the room's slot).
const COUNT_LIVE_LUA = `
local function liveConnections(hash, alivePrefix, userId)
  local n = 0
  local all = redis.call('HGETALL', hash)
  for i = 1, #all, 2 do
    local m = cjson.decode(all[i + 1])
    if m.userId == userId and redis.call('EXISTS', alivePrefix .. all[i]) == 1 then n = n + 1 end
  end
  return n
end
`
/**
 * KEYS[1]=members hash · ARGV: connectionId, memberJson, now, ttl, userId, alivePrefix,
 * channel, joinPayload → live count. Publishes inside the script so the transition event
 * is ordered with the state change across instances.
 */
export const JOIN_LUA = `${COUNT_LIVE_LUA}
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[4] * 2)
redis.call('SET', ARGV[6] .. ARGV[1], ARGV[3], 'EX', ARGV[4])
local n = liveConnections(KEYS[1], ARGV[6], ARGV[5])
if n == 1 then redis.call('PUBLISH', ARGV[7], ARGV[8]) end
return n
`
/**
 * KEYS[1]=members hash, KEYS[2]=alive key · ARGV: connectionId, memberJson, now, ttl.
 * Writes fresh member details but keeps the stored status (the client owns it).
 */
export const HEARTBEAT_LUA = `
local next = cjson.decode(ARGV[2])
local current = redis.call('HGET', KEYS[1], ARGV[1])
if current then next.status = cjson.decode(current).status end
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(next))
redis.call('EXPIRE', KEYS[1], ARGV[4] * 2)
redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[4])
`
/**
 * KEYS[1]=members hash · ARGV: connectionId, userId, status, alivePrefix, channel
 * → 1 if that connection was updated. Builds the per-user presence snapshot and publishes it
 * inside the script, so concurrent status changes cannot publish snapshots out of order.
 */
export const SET_STATUS_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 0 end
local m = cjson.decode(raw)
if m.userId ~= ARGV[2] then return 0 end
m.status = ARGV[3]
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(m))
local byUser = {}
local order = {}
local all = redis.call('HGETALL', KEYS[1])
for i = 1, #all, 2 do
  if redis.call('EXISTS', ARGV[4] .. all[i]) == 1 then
    local rec = cjson.decode(all[i + 1])
    local prev = byUser[rec.userId]
    if not prev then
      byUser[rec.userId] = rec
      order[#order + 1] = rec.userId
    elseif prev.status == 'idle' and rec.status == 'active' then
      byUser[rec.userId] = rec
    end
  end
end
local encoded = {}
for _, userId in ipairs(order) do encoded[#encoded + 1] = cjson.encode(byUser[userId]) end
redis.call('PUBLISH', ARGV[5], '{"json":{"type":"presence","members":[' .. table.concat(encoded, ',') .. ']}}')
return 1
`
/** KEYS[1]=members hash, KEYS[2]=alive key · ARGV: connectionId → 1 if the stale record was dropped */
export const PRUNE_LUA = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
return redis.call('HDEL', KEYS[1], ARGV[1])
`
/**
 * KEYS[1]=members hash · ARGV: connectionId, alivePrefix, channel, leavePayloadPrefix
 * → [userId, remaining live count]. The leave event is published inside the script.
 */
export const LEAVE_LUA = `${COUNT_LIVE_LUA}
local raw = redis.call('HGET', KEYS[1], ARGV[1])
redis.call('HDEL', KEYS[1], ARGV[1])
redis.call('DEL', ARGV[2] .. ARGV[1])
if not raw then return { '', -1 } end
local userId = cjson.decode(raw).userId
local n = liveConnections(KEYS[1], ARGV[2], userId)
if n == 0 then redis.call('PUBLISH', ARGV[3], ARGV[4]) end
return { userId, n }
`
