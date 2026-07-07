// src/widget/accentColor.js
// Client-brand accent color: parse a hex string and derive the dependent
// theme variables so a single data-accent-color attribute recolors the widget.

export function parseAccentColor(input) {
  if (typeof input !== 'string') return null
  const m = input.trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? `#${m[1].toLowerCase()}` : null
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex([r, g, b]) {
  const h = (n) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export function deriveAccentVars(hex) {
  const rgb = hexToRgb(hex)
  const hover = rgbToHex(rgb.map((c) => Math.round(c * 0.88)))
  const luma = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
  const text = luma > 0.6 ? '#1a1a2e' : '#ffffff'
  return {
    '--accent': hex,
    '--accent-hover': hover,
    '--accent-text': text,
    '--bubble-user': hex,
    '--bubble-user-text': text,
  }
}

export function applyAccentColor(input, root = document.documentElement) {
  if (!input) return
  const hex = parseAccentColor(input)
  if (!hex) {
    console.warn(`[ChatWidget] Invalid data-accent-color "${input}" — expected 6-digit hex. Using theme default.`)
    return
  }
  const vars = deriveAccentVars(hex)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}
