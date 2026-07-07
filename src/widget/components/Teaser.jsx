// src/widget/components/Teaser.jsx
// Proactive bubble shown next to the closed launcher. Clicking the text
// opens the chat; the ✕ dismisses it for the rest of the tab session.
export default function Teaser({ message, onOpen, onDismiss }) {
  return (
    <div class="teaser" role="status">
      <button class="teaser-close" onClick={onDismiss} aria-label="Dismiss">✕</button>
      <button class="teaser-text" onClick={onOpen}>{message}</button>
    </div>
  )
}
