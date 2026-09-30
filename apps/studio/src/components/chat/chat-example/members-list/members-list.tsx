import type { MembersListProps } from '../lib'
import { MEMBERS_EMPTY, MEMBERS_TITLE } from '../lib'

export function MembersList({ members }: MembersListProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {MEMBERS_TITLE} — {members.length}
      </p>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{MEMBERS_EMPTY}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm"
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              {member.name}
              <span className="sr-only">({member.status})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
