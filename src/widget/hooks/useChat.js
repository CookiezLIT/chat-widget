// src/widget/hooks/useChat.js
import { useState, useCallback } from 'preact/hooks'

// Empty string = relative URLs → hits Vite dev server mock in development
const BACKEND_URL = 'https://agent-expert-chat.redforest-e5c45670.francecentral.azurecontainerapps.io'

export function useChat(apiKey) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [sessionToken, setSessionToken] = useState(null)

  const initSession = useCallback(async () => {
    // Exchange public API key for a short-lived session JWT
    const res = await fetch(`${BACKEND_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    })
    if (!res.ok) throw new Error('Failed to start session')
    const data = await res.json()
    setSessionToken(data.token)
    return data.token
  }, [apiKey])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return
    setError(null)

    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      let token = sessionToken
      if (!token) token = await initSession()

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) throw new Error('Request failed')

      // Handle streaming SSE response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      const botMsg  = { role: 'assistant', content: '', id: Date.now() + 1 }
      setMessages(prev => [...prev, botMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        botMsg.content += chunk
        setMessages(prev => prev.map(m => m.id === botMsg.id ? { ...botMsg } : m))
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionToken, initSession])

  return { messages, loading, error, sendMessage }
}
