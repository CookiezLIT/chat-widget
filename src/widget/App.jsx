// src/widget/App.jsx
import { useState, useEffect } from 'preact/hooks'
import { useTheme } from './hooks/useTheme'
import { applyAccentColor } from './accentColor'
import { getTranslations } from './i18n'
import ChatButton from './components/ChatButton'
import ChatWindow from './components/ChatWindow'
import Teaser from './components/Teaser'

const TEASER_DISMISS_KEY = 'chat-widget-teaser-dismissed'
const TEASER_DELAY_MS = 3000

function isTeaserDismissed() {
  try { return sessionStorage.getItem(TEASER_DISMISS_KEY) === '1' } catch { return false }
}

function rememberTeaserDismissed() {
  try { sessionStorage.setItem(TEASER_DISMISS_KEY, '1') } catch { /* private mode — teaser will just reappear */ }
}

export default function App({ apiKey, theme, position, lang, welcomeMessage, accentColor, tagline, mobile }) {
  const [open, setOpen] = useState(false)
  const [teaserVisible, setTeaserVisible] = useState(false)
  useTheme(theme)

  useEffect(() => { applyAccentColor(accentColor) }, [accentColor])

  // Customer-supplied welcome text wins; otherwise the built-in translation.
  const resolvedWelcome = welcomeMessage || getTranslations(lang).welcomeMessage

  useEffect(() => {
    if (open || isTeaserDismissed()) return
    const id = setTimeout(() => setTeaserVisible(true), TEASER_DELAY_MS)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    const size = open
      ? { mode: 'open',   width: 440, height: 638 }
      : teaserVisible
        ? { mode: 'teaser', width: 340, height: 172 }
        : { mode: 'closed', width: 96,  height: 96 }
    window.parent.postMessage({ type: 'chat-widget-resize', ...size }, '*')
  }, [open, teaserVisible])

  const dismissTeaser = () => {
    setTeaserVisible(false)
    rememberTeaserDismissed()
  }

  const toggle = () => {
    setOpen(o => !o)
    // Once the visitor has engaged, the teaser has done its job for this session.
    setTeaserVisible(false)
    rememberTeaserDismissed()
  }

  return (
    <div class={`widget-root position-${position}${mobile ? ' is-mobile' : ''}${open ? ' is-open' : ''}`}>
      {open && (
        <ChatWindow
          apiKey={apiKey}
          lang={lang}
          tagline={tagline}
          welcomeMessage={resolvedWelcome}
          onClose={toggle}
        />
      )}
      {!open && teaserVisible && (
        <Teaser message={resolvedWelcome} onOpen={toggle} onDismiss={dismissTeaser} />
      )}
      {!(mobile && open) && <ChatButton open={open} onClick={toggle} />}
    </div>
  )
}
