// src/widget/components/MessageBubble.jsx
export default function MessageBubble({ message }) {
  return (
    <div class={`bubble bubble-${message.role}`}>
      {message.content}
    </div>
  )
}
