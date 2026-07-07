import { describe, it, expect } from 'vitest'
import { getTranslations } from '../src/widget/i18n.js'

const LANGS = ['en', 'ro', 'hu', 'fr', 'de']
const KEYS = [
  'welcomeMessage', 'chatTitle', 'inputPlaceholder', 'errorMessage',
  'voiceComingSoon', 'sendLabel', 'micLabel',
]

describe('i18n', () => {
  it.each(LANGS)('has every key for %s', (lang) => {
    const t = getTranslations(lang)
    for (const key of KEYS) {
      expect(t[key], `${lang}.${key}`).toBeTruthy()
    }
  })
  it('falls back to en for unknown languages', () => {
    expect(getTranslations('xx').voiceComingSoon).toBe('Voice coming soon')
  })
  it('normalizes regional tags', () => {
    expect(getTranslations('ro-RO').voiceComingSoon).toBe('Funcția vocală vine în curând')
  })
})
