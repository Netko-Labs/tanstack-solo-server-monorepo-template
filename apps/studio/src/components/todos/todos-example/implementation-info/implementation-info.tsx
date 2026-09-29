import { Card, CardContent, CardHeader, CardTitle } from '@temp-repo/ui/components/card'
import {
  IMPLEMENTATION_HINT,
  IMPLEMENTATION_QUERY,
  IMPLEMENTATION_TITLE,
  IMPLEMENTATION_TRANSPORT,
} from '../lib'

export function ImplementationInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{IMPLEMENTATION_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>TanStack Query:</strong> {IMPLEMENTATION_QUERY}
        </p>
        <p>
          <strong>Transport:</strong> {IMPLEMENTATION_TRANSPORT}
        </p>
        <p className="text-muted-foreground">{IMPLEMENTATION_HINT}</p>
      </CardContent>
    </Card>
  )
}
