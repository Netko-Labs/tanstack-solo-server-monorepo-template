import { Badge } from '@temp-repo/ui/components/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@temp-repo/ui/components/card'
import { TRANSPORT_BADGE, TRANSPORT_DESCRIPTION, TRANSPORT_TITLE } from '../lib'

export function TransportInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {TRANSPORT_TITLE}
          <Badge variant="secondary">{TRANSPORT_BADGE}</Badge>
        </CardTitle>
        <CardDescription>{TRANSPORT_DESCRIPTION}</CardDescription>
      </CardHeader>
    </Card>
  )
}
