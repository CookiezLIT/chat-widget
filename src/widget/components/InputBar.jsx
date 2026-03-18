// src/widget/components/InputBar.jsx
import { useState } from 'preact/hooks'

export default function InputBar({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div class="input-bar">
      <textarea
        class="input-field"
        value={value}
        onInput={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        aria-label="Message input"
      />
      <button
        class="send-btn"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        ➤
      </button>
    </div>
  )
}
