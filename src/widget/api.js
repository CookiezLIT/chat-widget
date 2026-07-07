// src/widget/api.js
// Backend request payloads. lang rides on every request so the bot can
// answer in the visitor's language without server-side session state.

export function buildSessionPayload(apiKey, lang) {
  return { apiKey, lang: lang || 'en' }
}

export function buildChatPayload(message, lang) {
  return { message, lang: lang || 'en' }
}
