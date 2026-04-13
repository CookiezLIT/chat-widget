(function () {
  const script  = document.currentScript
  const apiKey  = script.getAttribute('data-api-key')
  const theme   = script.getAttribute('data-theme')    || 'white-blue'
  const position = script.getAttribute('data-position') || 'bottom-right'

  // Welcome message — customer supplies translated text, or the widget falls
  // back to its built-in default for the detected language.
  const welcomeMessage = script.getAttribute('data-welcome-message') || ''

  // Language — explicit override wins; otherwise inherit the host page's
  // <html lang="…"> attribute (set by React, Angular, WordPress, PHP, etc.);
  // finally fall back to the browser's preferred language.
  const lang =
    script.getAttribute('data-lang') ||
    document.documentElement.lang    ||
    navigator.language                ||
    'en'

  // Derive base URL from the script's own src (same directory)
  const baseUrl = script.src.substring(0, script.src.lastIndexOf('/'))

  if (!apiKey) {
    console.warn('[ChatWidget] Missing data-api-key attribute.')
    return
  }

  // Build iframe URL — pass config as query params (non-sensitive only)
  const params = new URLSearchParams({ apiKey, theme, position, lang, welcomeMessage })
  const iframeSrc = `${baseUrl}/widget?${params}`

  // Create sandboxed iframe
  const iframe = document.createElement('iframe')
  iframe.src = iframeSrc
  iframe.id  = 'chat-widget-iframe'

  // Sandboxing: allow scripts and forms only — NO same-origin, NO top-nav
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin')
  iframe.setAttribute('allow', '')

  Object.assign(iframe.style, {
    position:   'fixed',
    bottom:     position.includes('bottom') ? '0' : 'auto',
    top:        position.includes('top')    ? '0' : 'auto',
    right:      position.includes('right')  ? '0' : 'auto',
    left:       position.includes('left')   ? '0' : 'auto',
    width:      '96px',
    height:     '96px',
    border:     'none',
    zIndex:     '2147483647',
    background: 'transparent',
  })

  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return
    if (e.data && e.data.type === 'chat-widget-resize') {
      iframe.style.width  = e.data.width  + 'px'
      iframe.style.height = e.data.height + 'px'
    }
  })

  const mount = () => document.body.appendChild(iframe)
  if (document.body) {
    mount()
  } else {
    document.addEventListener('DOMContentLoaded', mount)
  }
})()
