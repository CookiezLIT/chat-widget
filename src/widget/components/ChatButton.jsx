// src/widget/components/ChatButton.jsx
export default function ChatButton({ open, onClick }) {
  return (
    <button
      class="chat-fab"
      onClick={onClick}
      aria-label={open ? 'Close chat' : 'Open chat'}
    >
      {open ? '✕' : '💬'}
    </button>
  )
}
