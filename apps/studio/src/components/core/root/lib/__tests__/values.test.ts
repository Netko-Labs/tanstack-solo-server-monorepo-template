import { describe, expect, test } from 'bun:test'
import manifest from '../../../../../../public/manifest.json'
import { APP_DESCRIPTION, APP_NAME, APP_THEME_COLOR } from '../values'

describe('public/manifest.json', () => {
  test('mirrors the app head constants', () => {
    expect(manifest).toMatchObject({
      short_name: APP_NAME,
      name: APP_NAME,
      description: APP_DESCRIPTION,
      theme_color: APP_THEME_COLOR,
    })
  })
})
