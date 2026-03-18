// src/widget/components/ChatWindow.jsx
import { useChat } from '../hooks/useChat'
import { getTranslations } from '../i18n'
import MessageList from './MessageList'
import InputBar from './InputBar'

export default function ChatWindow({ apiKey, lang, welcomeMessage, onClose }) {
  const { messages, loading, error, sendMessage } = useChat(apiKey)
  const t = getTranslations(lang)

  // Customer-supplied message takes priority; fall back to built-in translation.
  const resolvedWelcome = welcomeMessage || t.welcomeMessage

  return (
    <div class="chat-window" role="dialog" aria-label="Chat">
      <header class="chat-header">
        <span class="chat-title">{t.chatTitle}</span>
        <button class="chat-close" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <MessageList messages={messages} loading={loading} welcomeMessage={resolvedWelcome} />
      {error && <div class="chat-error">{t.errorMessage}</div>}
      <InputBar onSend={sendMessage} disabled={loading} placeholder={t.inputPlaceholder} />
    </div>
  )
}
