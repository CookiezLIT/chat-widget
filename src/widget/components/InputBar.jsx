// src/widget/components/InputBar.jsx
import { useState, useRef, useEffect } from 'preact/hooks'

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export default function InputBar({ onSend, disabled, t }) {
  const [value, setValue] = useState('')
  const [showVoiceTip, setShowVoiceTip] = useState(false)
  const tipTimer = useRef()

  useEffect(() => () => clearTimeout(tipTimer.current), [])

  const submit = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  // Voice isn't wired to the backend yet — advertise it, don't fake it.
  const onMicClick = () => {
    setShowVoiceTip(true)
    clearTimeout(tipTimer.current)
    tipTimer.current = setTimeout(() => setShowVoiceTip(false), 2000)
  }

  return (
    <div class="input-bar">
      {showVoiceTip && <div class="voice-tooltip" role="status">{t.voiceComingSoon}</div>}
      <textarea
        class="input-field"
        value={value}
        onInput={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t.inputPlaceholder}
        rows={1}
        disabled={disabled}
        aria-label="Message input"
      />
      <button class="mic-btn" onClick={onMicClick} aria-label={t.micLabel}>
        <MicIcon />
      </button>
      <button
        class="send-btn"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label={t.sendLabel}
      >
        <SendIcon />
      </button>
    </div>
  )
}
