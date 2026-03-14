// src/widget/components/ChatWindow.jsx
import { useChat } from '../hooks/useChat'
import MessageList from './MessageList'
import InputBar from './InputBar'

export default function ChatWindow({ apiKey, onClose }) {
  const { messages, loading, error, sendMessage } = useChat(apiKey)

  return (
    <div class="chat-window" role="dialog" aria-label="Chat">
      <header class="chat-header">
        <span class="chat-title">Chat with us</span>
        <button class="chat-close" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <MessageList messages={messages} loading={loading} />
      {error && <div class="chat-error">{error}</div>}
      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  )
}
