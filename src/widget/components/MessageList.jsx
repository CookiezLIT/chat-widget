// src/widget/components/MessageList.jsx
import { useEffect, useRef } from 'preact/hooks'
import MessageBubble from './MessageBubble'

export default function MessageList({ messages, loading }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages])

  return (
    <div class="message-list" ref={ref} aria-live="polite">
      {messages.length === 0 && (
        <p class="chat-empty">Hi! How can I help you today?</p>
      )}
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      {loading && <div class="typing-indicator"><span /><span /><span /></div>}
    </div>
  )
}
