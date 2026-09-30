import { Badge } from '@temp-repo/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@temp-repo/ui/components/card'
import type { TransportInfoProps } from '../lib'
import { TRANSPORT_BADGE, TRANSPORT_DESCRIPTION, TRANSPORT_TITLE, TRANSPORT_WRITES } from '../lib'

export function TransportInfo({ completedWrites }: TransportInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {TRANSPORT_TITLE}
          <Badge variant="secondary">{TRANSPORT_BADGE}</Badge>
        </CardTitle>
        <CardDescription>{TRANSPORT_DESCRIPTION}</CardDescription>
      </CardHeader>
      {completedWrites > 0 && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {TRANSPORT_WRITES}: {completedWrites}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
