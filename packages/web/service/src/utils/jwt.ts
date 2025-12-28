import { webEnvConfig } from '@temp-repo/web-config'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export async function validateToken(token: string) {
  const jwks = createRemoteJWKSet(new URL(`${webEnvConfig.app.baseUrl}/api/auth/jwks`))
  const { payload } = await jwtVerify(token, jwks, {
    issuer: webEnvConfig.app.baseUrl,
    audience: webEnvConfig.app.baseUrl,
  })
  return payload
}
