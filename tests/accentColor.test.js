import { describe, it, expect } from 'vitest'
import { parseAccentColor, deriveAccentVars } from '../src/widget/accentColor.js'

describe('parseAccentColor', () => {
  it('normalizes valid hex with #', () => {
    expect(parseAccentColor('#FF6600')).toBe('#ff6600')
  })
  it('normalizes valid hex without #', () => {
    expect(parseAccentColor('ff6600')).toBe('#ff6600')
  })
  it('rejects 3-digit hex', () => {
    expect(parseAccentColor('#f60')).toBeNull()
  })
  it('rejects named colors and garbage', () => {
    expect(parseAccentColor('red')).toBeNull()
    expect(parseAccentColor('')).toBeNull()
    expect(parseAccentColor(null)).toBeNull()
  })
})

describe('deriveAccentVars', () => {
  it('derives darker hover and white text for a dark accent', () => {
    const vars = deriveAccentVars('#2563eb')
    expect(vars['--accent']).toBe('#2563eb')
    expect(vars['--accent-hover']).toBe('#2157cf')
    expect(vars['--accent-text']).toBe('#ffffff')
    expect(vars['--bubble-user']).toBe('#2563eb')
    expect(vars['--bubble-user-text']).toBe('#ffffff')
  })
  it('picks dark text for a light accent', () => {
    const vars = deriveAccentVars('#ffe066')
    expect(vars['--accent-hover']).toBe('#e0c55a')
    expect(vars['--accent-text']).toBe('#1a1a2e')
  })
})
