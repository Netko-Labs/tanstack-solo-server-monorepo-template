import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

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
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      experimental: { websocket: true },
      handlers: [{ route: '/trpc-ws', handler: './src/server/trpc-ws.ts' }],
      plugins: ['./src/server/plugins/shutdown.ts'],
      routeRules: {
        '/**': {
          headers: command === 'build' ? { ...SECURITY_HEADERS, ...HSTS_HEADER } : SECURITY_HEADERS,
        },
      },
    }),
    viteReact(),
  ],
}))
