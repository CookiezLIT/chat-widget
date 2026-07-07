// src/widget/components/ChatWindow.jsx
import { useChat } from '../hooks/useChat'
import { getTranslations } from '../i18n'
import MessageList from './MessageList'
import InputBar from './InputBar'

export default function ChatWindow({ apiKey, lang, tagline, welcomeMessage, onClose }) {
  const { messages, loading, error, sendMessage } = useChat(apiKey, lang)
  const t = getTranslations(lang)

  return (
    <div class="chat-window" role="dialog" aria-label="Chat">
      <header class="chat-header">
        <div class="chat-header-info">
          <span class="chat-title">{t.chatTitle}</span>
          {tagline && <span class="chat-tagline">{tagline}</span>}
        </div>
        <button class="chat-close" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <MessageList messages={messages} loading={loading} welcomeMessage={welcomeMessage} />
      {error && <div class="chat-error">{t.errorMessage}</div>}
      <InputBar onSend={sendMessage} disabled={loading} t={t} />
    </div>
  )
}
