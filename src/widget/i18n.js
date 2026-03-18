// src/widget/i18n.js
// Built-in UI string translations.
// Add a new key here to support an additional language — no other files need changing.
const translations = {
  en: {
    welcomeMessage:   'Hi, how can I help you?',
    chatTitle:        'Chat with us',
    inputPlaceholder: 'Type a message…',
    errorMessage:     'Something went wrong.',
  },
  ro: {
    welcomeMessage:   'Bună, cu ce te pot ajuta?',
    chatTitle:        'Discută cu noi',
    inputPlaceholder: 'Scrie un mesaj…',
    errorMessage:     'Ceva a mers greșit.',
  },
  hu: {
    welcomeMessage:   'Szia, miben segíthetek?',
    chatTitle:        'Csevegj velünk',
    inputPlaceholder: 'Írj egy üzenetet…',
    errorMessage:     'Valami hiba történt.',
  },
  fr: {
    welcomeMessage:   'Bonjour, comment puis-je vous aider ?',
    chatTitle:        'Discutez avec nous',
    inputPlaceholder: 'Écrire un message…',
    errorMessage:     'Une erreur s\'est produite.',
  },
  de: {
    welcomeMessage:   'Hallo, wie kann ich Ihnen helfen?',
    chatTitle:        'Chatte mit uns',
    inputPlaceholder: 'Nachricht eingeben…',
    errorMessage:     'Etwas ist schiefgelaufen.',
  },
}

/**
 * Normalise a BCP-47 lang tag to a supported base language.
 * "fr-FR" → "fr", "ro-RO" → "ro", unknown → "en".
 */
function normalizeLang(lang) {
  if (!lang) return 'en'
  const base = lang.split('-')[0].toLowerCase()
  return translations[base] ? base : 'en'
}

/** Returns the full translation object for the given lang tag. */
export function getTranslations(lang) {
  return translations[normalizeLang(lang)]
}
