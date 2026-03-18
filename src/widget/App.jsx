// src/widget/App.jsx
import { useState } from 'preact/hooks'
import { useTheme } from './hooks/useTheme'
import ChatButton from './components/ChatButton'
import ChatWindow from './components/ChatWindow'

export default function App({ apiKey, theme, position, lang, welcomeMessage }) {
  const [open, setOpen] = useState(false)
  useTheme(theme)

  const toggle = () => setOpen(o => !o)

  return (
    <div class={`widget-root position-${position}`}>
      {open && (
        <ChatWindow
          apiKey={apiKey}
          lang={lang}
          welcomeMessage={welcomeMessage}
          onClose={toggle}
        />
      )}
      <ChatButton open={open} onClick={toggle} />
    </div>
  )
}
