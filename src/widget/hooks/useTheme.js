// src/widget/hooks/useTheme.js
import { useEffect } from 'preact/hooks'

export function useTheme(theme) {
  const validThemes = ['white-blue', 'black-blue', 'white-green', 'black-green']
  const resolved = validThemes.includes(theme) ? theme : 'white-blue'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  return resolved
}
