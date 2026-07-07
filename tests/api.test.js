import { describe, it, expect } from 'vitest'
import { buildSessionPayload, buildChatPayload } from '../src/widget/api.js'

describe('request payloads', () => {
  it('session payload carries apiKey and lang', () => {
    expect(buildSessionPayload('pk_123', 'ro')).toEqual({ apiKey: 'pk_123', lang: 'ro' })
  })
  it('chat payload carries message and lang', () => {
    expect(buildChatPayload('Salut', 'ro')).toEqual({ message: 'Salut', lang: 'ro' })
  })
  it('defaults lang to en when missing', () => {
    expect(buildSessionPayload('pk_123', undefined).lang).toBe('en')
    expect(buildChatPayload('Hi', '').lang).toBe('en')
  })
})
