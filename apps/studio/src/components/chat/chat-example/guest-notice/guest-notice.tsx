import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@temp-repo/ui/components/button'
import { Card, CardContent } from '@temp-repo/ui/components/card'
import { GUEST_CTA, GUEST_MESSAGE } from '../lib'

export function GuestNotice() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground">{GUEST_MESSAGE}</p>
        <Link to="/sign-in" search={{ redirect: '/chat' }} className={buttonVariants()}>
          {GUEST_CTA}
        </Link>
      </CardContent>
    </Card>
  )
}
