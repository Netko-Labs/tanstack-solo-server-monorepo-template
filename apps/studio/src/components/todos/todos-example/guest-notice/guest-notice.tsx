import { Link } from '@tanstack/react-router'
import { Button } from '@temp-repo/ui/components/button'
import { Card, CardContent } from '@temp-repo/ui/components/card'
import { GUEST_CTA, GUEST_MESSAGE } from '../lib'

export function GuestNotice() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground">{GUEST_MESSAGE}</p>
        <Button render={<Link to="/sign-in" />}>{GUEST_CTA}</Button>
      </CardContent>
    </Card>
  )
}
