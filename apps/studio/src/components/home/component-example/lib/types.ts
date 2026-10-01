import type { LinkProps } from '@tanstack/react-router'

export interface FeatureCardProps {
  title: string
  description: string
  href: LinkProps['to']
  badge?: string
}

export interface CodeBlockProps {
  code: string
  language?: string
}
