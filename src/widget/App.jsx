// src/widget/App.jsx
import { useState, useEffect } from 'preact/hooks'
import { useTheme } from './hooks/useTheme'
import { applyAccentColor } from './accentColor'
import ChatButton from './components/ChatButton'
import ChatWindow from './components/ChatWindow'

export default function App({ apiKey, theme, position, lang, welcomeMessage, accentColor, tagline, mobile }) {
  const [open, setOpen] = useState(false)
  useTheme(theme)

  useEffect(() => { applyAccentColor(accentColor) }, [accentColor])

  useEffect(() => {
    window.parent.postMessage({
      type:   'chat-widget-resize',
      mode:   open ? 'open' : 'closed',
      width:  open ? 440 : 96,
      height: open ? 638 : 96,
    }, '*')
  }, [open])

  const toggle = () => setOpen(o => !o)

  return (
    <div class={`widget-root position-${position}${mobile ? ' is-mobile' : ''}`}>
      {open && (
        <ChatWindow
          apiKey={apiKey}
          lang={lang}
          tagline={tagline}
          welcomeMessage={welcomeMessage}
          onClose={toggle}
        />
      )}
      <ChatButton open={open} onClick={toggle} />
    </div>
  )
}
