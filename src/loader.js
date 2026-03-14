(function () {
  const script = document.currentScript
  const apiKey = script.getAttribute('data-api-key')
  const theme  = script.getAttribute('data-theme') || 'white-blue'
  const position = script.getAttribute('data-position') || 'bottom-right'
  const baseUrl = script.getAttribute('data-base-url') || 'https://chat.yourservice.com'

  if (!apiKey) {
    console.warn('[ChatWidget] Missing data-api-key attribute.')
    return
  }

  // Build iframe URL — pass config as query params (non-sensitive only)
  const params = new URLSearchParams({ apiKey, theme, position })
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
    width:      '420px',
    height:     '100vh',
    maxHeight:  '100vh',
    border:     'none',
    zIndex:     '2147483647',
    background: 'transparent',
    pointerEvents: 'none',
  })

  document.body.appendChild(iframe)

  // Allow iframe to request resize via postMessage
  window.addEventListener('message', (e) => {
    if (e.origin !== new URL(baseUrl).origin) return
    if (e.data?.type === 'CHAT_RESIZE') {
      iframe.style.pointerEvents = e.data.open ? 'all' : 'none'
    }
  })
})()
