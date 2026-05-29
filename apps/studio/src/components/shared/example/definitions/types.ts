import type { ComponentProps } from 'react'

export type ExampleWrapperProps = ComponentProps<'div'>

export type ExampleProps = ComponentProps<'div'> & {
  title: string
  containerClassName?: string
}
