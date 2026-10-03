import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { environmentOf, releaseOf } from '@temp-repo/observability'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
}

// Built servers only: HSTS on a dev https *.localhost would pin every local project for a year.
const HSTS_HEADER = { 'strict-transport-security': 'max-age=31536000; includeSubDomains' }

export default defineConfig(({ command }) => ({
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  resolve: { tsconfigPaths: true },
  // Not studio-config: its production env check would throw at build time without runtime secrets.
  define: {
    'import.meta.env.VITE_RELEASE': JSON.stringify(releaseOf(process.env)),
    'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(environmentOf(process.env)),
  },
  build: {
    rolldownOptions: {
      // Every React library ships 'use client'; the warning is noise for an SSR bundle.
      onLog(level, log, handler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
        handler(level, log)
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      experimental: { websocket: true },
      handlers: [{ route: '/trpc-ws', handler: './src/server/trpc-ws.ts' }],
      plugins: ['./src/server/plugins/observability.ts', './src/server/plugins/shutdown.ts'],
      routeRules: {
        '/**': {
          headers: command === 'build' ? { ...SECURITY_HEADERS, ...HSTS_HEADER } : SECURITY_HEADERS,
        },
      },
    }),
    viteReact(),
  ],
}))
