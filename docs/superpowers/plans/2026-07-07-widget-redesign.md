# Chat Widget Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the embeddable chat widget to an allai.ro-inspired format: square "AI" launcher with teaser bubble, 400×530 floating window, `data-accent-color` theming, `lang` sent on all backend requests, and a "coming soon" mic button.

**Architecture:** Loader script (`src/loader.js`) injects a sandboxed iframe hosting a Preact app (`src/widget/`). Config flows loader → query params → app props. The app posts `chat-widget-resize` messages back so the loader can resize the iframe. All changes stay within this architecture; the only backend contract change is adding `lang` to request bodies.

**Tech Stack:** Preact 10, Vite 7, vitest (new devDependency) for unit tests, Playwright MCP browser for end-to-end verification against `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-07-07-widget-redesign-design.md`

## Global Constraints

- Supported UI languages: en, ro, hu, fr, de — every i18n key must exist in all five.
- Iframe sizes (postMessage protocol): closed 96×96, teaser 340×172, open desktop 440×638, open mobile 100%×100%.
- Window: 400×530px, border-radius 16px, 20px from screen edges, shadow `0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)`.
- Launcher: 56×56px, border-radius 14px, text "AI", hover scale 1.06.
- `data-accent-color` accepts 6-digit hex only (`#rrggbb`, `#` optional); invalid values → `console.warn` + preset theme stands.
- Mobile = parent-page viewport ≤ 480px. **Media queries inside the iframe are useless for this** (the desktop iframe is only 440px wide, so `max-width: 480px` would match on desktop!). The loader detects mobile and passes `mobile=1` as a query param; the app sets an `is-mobile` class.
- Backend contract: `POST /api/session` body `{ apiKey, lang }`; `POST /api/chat` body `{ message, lang }`.
- sessionStorage key for teaser dismissal: `chat-widget-teaser-dismissed` (value `'1'`). Wrap all sessionStorage access in try/catch.
- Commit after every task. No new runtime dependencies.

---

### Task 1: Test infrastructure + accent color utility

**Files:**
- Modify: `package.json` (add vitest devDependency + test script)
- Create: `vitest.config.js`
- Create: `src/widget/accentColor.js`
- Test: `tests/accentColor.test.js`

**Interfaces:**
- Produces: `parseAccentColor(input: string) → '#rrggbb' | null`, `deriveAccentVars(hex: string) → { '--accent', '--accent-hover', '--accent-text', '--bubble-user', '--bubble-user-text' }`, `applyAccentColor(input: string, root?: HTMLElement) → void` (Task 5/7 consume `applyAccentColor` from `../accentColor`).

- [ ] **Step 1: Install vitest and add test script**

Run: `npm install -D vitest@^3.2.4`

Then in `package.json` scripts add: `"test": "vitest run"`.

Create `vitest.config.js` at repo root:

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
  },
})
```

- [ ] **Step 2: Write the failing test**

Create `tests/accentColor.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { parseAccentColor, deriveAccentVars } from '../src/widget/accentColor.js'

describe('parseAccentColor', () => {
  it('normalizes valid hex with #', () => {
    expect(parseAccentColor('#FF6600')).toBe('#ff6600')
  })
  it('normalizes valid hex without #', () => {
    expect(parseAccentColor('ff6600')).toBe('#ff6600')
  })
  it('rejects 3-digit hex', () => {
    expect(parseAccentColor('#f60')).toBeNull()
  })
  it('rejects named colors and garbage', () => {
    expect(parseAccentColor('red')).toBeNull()
    expect(parseAccentColor('')).toBeNull()
    expect(parseAccentColor(null)).toBeNull()
  })
})

describe('deriveAccentVars', () => {
  it('derives darker hover and white text for a dark accent', () => {
    const vars = deriveAccentVars('#2563eb')
    expect(vars['--accent']).toBe('#2563eb')
    expect(vars['--accent-hover']).toBe('#2157cf')
    expect(vars['--accent-text']).toBe('#ffffff')
    expect(vars['--bubble-user']).toBe('#2563eb')
    expect(vars['--bubble-user-text']).toBe('#ffffff')
  })
  it('picks dark text for a light accent', () => {
    const vars = deriveAccentVars('#ffe066')
    expect(vars['--accent-hover']).toBe('#e0c55a')
    expect(vars['--accent-text']).toBe('#1a1a2e')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/widget/accentColor.js`.

- [ ] **Step 4: Write the implementation**

Create `src/widget/accentColor.js`:

```js
// src/widget/accentColor.js
// Client-brand accent color: parse a hex string and derive the dependent
// theme variables so a single data-accent-color attribute recolors the widget.

export function parseAccentColor(input) {
  if (typeof input !== 'string') return null
  const m = input.trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? `#${m[1].toLowerCase()}` : null
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex([r, g, b]) {
  const h = (n) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export function deriveAccentVars(hex) {
  const rgb = hexToRgb(hex)
  const hover = rgbToHex(rgb.map((c) => Math.round(c * 0.88)))
  const luma = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
  const text = luma > 0.6 ? '#1a1a2e' : '#ffffff'
  return {
    '--accent': hex,
    '--accent-hover': hover,
    '--accent-text': text,
    '--bubble-user': hex,
    '--bubble-user-text': text,
  }
}

export function applyAccentColor(input, root = document.documentElement) {
  if (!input) return
  const hex = parseAccentColor(input)
  if (!hex) {
    console.warn(`[ChatWidget] Invalid data-accent-color "${input}" — expected 6-digit hex. Using theme default.`)
    return
  }
  const vars = deriveAccentVars(hex)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/widget/accentColor.js tests/accentColor.test.js
git commit -m "feat: add accent color derivation with vitest infrastructure"
```

---

### Task 2: i18n keys for voice, send, and mic labels

**Files:**
- Modify: `src/widget/i18n.js`
- Test: `tests/i18n.test.js`

**Interfaces:**
- Produces: `getTranslations(lang)` now also returns `voiceComingSoon`, `sendLabel`, `micLabel` (consumed by Task 7's InputBar via the `t` prop).

- [ ] **Step 1: Write the failing test**

Create `tests/i18n.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getTranslations } from '../src/widget/i18n.js'

const LANGS = ['en', 'ro', 'hu', 'fr', 'de']
const KEYS = [
  'welcomeMessage', 'chatTitle', 'inputPlaceholder', 'errorMessage',
  'voiceComingSoon', 'sendLabel', 'micLabel',
]

describe('i18n', () => {
  it.each(LANGS)('has every key for %s', (lang) => {
    const t = getTranslations(lang)
    for (const key of KEYS) {
      expect(t[key], `${lang}.${key}`).toBeTruthy()
    }
  })
  it('falls back to en for unknown languages', () => {
    expect(getTranslations('xx').voiceComingSoon).toBe('Voice coming soon')
  })
  it('normalizes regional tags', () => {
    expect(getTranslations('ro-RO').voiceComingSoon).toBe('Funcția vocală vine în curând')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `voiceComingSoon` undefined for every language.

- [ ] **Step 3: Add the keys**

In `src/widget/i18n.js`, extend each language object:

```js
  en: {
    welcomeMessage:   'Hi, how can I help you?',
    chatTitle:        'Chat with us',
    inputPlaceholder: 'Type a message…',
    errorMessage:     'Something went wrong.',
    voiceComingSoon:  'Voice coming soon',
    sendLabel:        'Send message',
    micLabel:         'Voice input',
  },
  ro: {
    welcomeMessage:   'Bună, cu ce te pot ajuta?',
    chatTitle:        'Discută cu noi',
    inputPlaceholder: 'Scrie un mesaj…',
    errorMessage:     'Ceva a mers greșit.',
    voiceComingSoon:  'Funcția vocală vine în curând',
    sendLabel:        'Trimite mesajul',
    micLabel:         'Intrare vocală',
  },
  hu: {
    welcomeMessage:   'Szia, miben segíthetek?',
    chatTitle:        'Csevegj velünk',
    inputPlaceholder: 'Írj egy üzenetet…',
    errorMessage:     'Valami hiba történt.',
    voiceComingSoon:  'A hangfunkció hamarosan érkezik',
    sendLabel:        'Üzenet küldése',
    micLabel:         'Hangbevitel',
  },
  fr: {
    welcomeMessage:   'Bonjour, comment puis-je vous aider ?',
    chatTitle:        'Discutez avec nous',
    inputPlaceholder: 'Écrire un message…',
    errorMessage:     'Une erreur s\'est produite.',
    voiceComingSoon:  'La voix arrive bientôt',
    sendLabel:        'Envoyer le message',
    micLabel:         'Entrée vocale',
  },
  de: {
    welcomeMessage:   'Hallo, wie kann ich Ihnen helfen?',
    chatTitle:        'Chatte mit uns',
    inputPlaceholder: 'Nachricht eingeben…',
    errorMessage:     'Etwas ist schiefgelaufen.',
    voiceComingSoon:  'Sprachfunktion kommt bald',
    sendLabel:        'Nachricht senden',
    micLabel:         'Spracheingabe',
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/widget/i18n.js tests/i18n.test.js
git commit -m "feat: add voice/send/mic i18n strings"
```

---

### Task 3: Send `lang` on all backend requests

**Files:**
- Create: `src/widget/api.js`
- Modify: `src/widget/hooks/useChat.js`
- Modify: `vite.config.js` (mock logs received bodies)
- Test: `tests/api.test.js`

**Interfaces:**
- Produces: `buildSessionPayload(apiKey, lang) → { apiKey, lang }`, `buildChatPayload(message, lang) → { message, lang }`; `useChat(apiKey, lang)` (new second parameter — Task 7's ChatWindow passes it).

- [ ] **Step 1: Write the failing test**

Create `tests/api.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildSessionPayload, buildChatPayload } from '../src/widget/api.js'

describe('request payloads', () => {
  it('session payload carries apiKey and lang', () => {
    expect(buildSessionPayload('pk_123', 'ro')).toEqual({ apiKey: 'pk_123', lang: 'ro' })
  })
  it('chat payload carries message and lang', () => {
    expect(buildChatPayload('Salut', 'ro')).toEqual({ message: 'Salut', lang: 'ro' })
  })
  it('defaults lang to en when missing', () => {
    expect(buildSessionPayload('pk_123', undefined).lang).toBe('en')
    expect(buildChatPayload('Hi', '').lang).toBe('en')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/widget/api.js`.

- [ ] **Step 3: Implement payload builders**

Create `src/widget/api.js`:

```js
// src/widget/api.js
// Backend request payloads. lang rides on every request so the bot can
// answer in the visitor's language without server-side session state.

export function buildSessionPayload(apiKey, lang) {
  return { apiKey, lang: lang || 'en' }
}

export function buildChatPayload(message, lang) {
  return { message, lang: lang || 'en' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Wire into useChat**

In `src/widget/hooks/useChat.js`:

Add import at top:

```js
import { buildSessionPayload, buildChatPayload } from '../api'
```

Change the hook signature:

```js
export function useChat(apiKey, lang) {
```

In `initSession`, change the fetch body and dependency array:

```js
      body: JSON.stringify(buildSessionPayload(apiKey, lang)),
```

and `}, [apiKey, lang])`.

In `sendMessage`, change the `/api/chat` body:

```js
        body: JSON.stringify(buildChatPayload(text, lang)),
```

- [ ] **Step 6: Make the dev mock log received bodies**

In `vite.config.js` `mockApiPlugin`, replace the `/api/session` handler body-less version with one that drains and logs, and add logging to `/api/chat`:

```js
      server.middlewares.use('/api/session', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        await new Promise(resolve => {
          req.on('data', c => { body += c })
          req.on('end', resolve)
        })
        console.log('[mock /api/session]', body)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ token: 'mock-dev-token' }))
      })
```

and in the `/api/chat` handler replace the drain block with:

```js
        let body = ''
        await new Promise(resolve => {
          req.on('data', c => { body += c })
          req.on('end', resolve)
        })
        console.log('[mock /api/chat]', body)
```

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 8: Commit**

```bash
git add src/widget/api.js src/widget/hooks/useChat.js vite.config.js tests/api.test.js
git commit -m "feat: send lang on session and chat requests"
```

---

### Task 4: Loader — microphone permission, new attributes, mobile sizing

**Files:**
- Modify: `src/loader.js`
- Modify: `index.html` (dev harness exercises new attributes)

**Interfaces:**
- Consumes: nothing new.
- Produces: query params `accentColor`, `tagline`, `mobile` (read by Task 5's `main.jsx`); resize protocol now honors `e.data.mode` (`'open' | 'teaser' | 'closed'`, sent by Task 6's App).

- [ ] **Step 1: Read new attributes and forward them**

In `src/loader.js`, after the `lang` resolution block, add:

```js
  // Brand accent color (6-digit hex) and optional header tagline
  const accentColor = script.getAttribute('data-accent-color') || ''
  const tagline     = script.getAttribute('data-tagline')      || ''

  // Media queries inside the iframe see the IFRAME's width (440px when open
  // on desktop), so mobile detection must happen here on the parent page.
  const isMobile = () => window.matchMedia('(max-width: 480px)').matches
```

Change the params line to:

```js
  const params = new URLSearchParams({
    apiKey, theme, position, lang, welcomeMessage, accentColor, tagline,
    mobile: isMobile() ? '1' : '0',
  })
```

- [ ] **Step 2: Allow microphone (future voice)**

Change `iframe.setAttribute('allow', '')` to:

```js
  iframe.setAttribute('allow', 'microphone')
```

- [ ] **Step 3: Honor mode in the resize handler**

Replace the message listener body with:

```js
  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return
    if (e.data && e.data.type === 'chat-widget-resize') {
      if (e.data.mode === 'open' && isMobile()) {
        iframe.style.width  = '100%'
        iframe.style.height = '100%'
      } else {
        iframe.style.width  = e.data.width  + 'px'
        iframe.style.height = e.data.height + 'px'
      }
    }
  })
```

- [ ] **Step 4: Exercise new attributes in the dev harness**

In `index.html`, update the embed script tag:

```html
  <script
    src="/src/loader.js"
    data-api-key="pk_test_dev"
    data-theme="white-blue"
    data-position="bottom-right"
    data-tagline="Your AI assistant"
    data-accent-color="#e11d48">
  </script>
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev` (background). Open `http://localhost:5173/` with the Playwright browser and check the iframe element has `allow="microphone"` and its `src` contains `accentColor=%23e11d48&tagline=Your+AI+assistant&mobile=0` (URLSearchParams encodes `#` as `%23` and spaces as `+`).

- [ ] **Step 6: Commit**

```bash
git add src/loader.js index.html
git commit -m "feat: loader passes accent color, tagline, mobile flag; allows microphone"
```

---

### Task 5: Square "AI" launcher + accent/mobile wiring in the app shell

**Files:**
- Modify: `src/widget/main.jsx`
- Modify: `src/widget/App.jsx`
- Modify: `src/widget/components/ChatButton.jsx`
- Modify: `src/widget/styles/base.css` (launcher styles)

**Interfaces:**
- Consumes: `applyAccentColor` from `src/widget/accentColor.js` (Task 1); query params from Task 4.
- Produces: `App` props now include `accentColor`, `tagline`, `mobile` (bool). `ChatButton` renders `.chat-launcher`. Root div gains `is-mobile` class when mobile. Task 6 and 7 build on this App shape.

- [ ] **Step 1: Pass new params in main.jsx**

Replace the `render(...)` call in `src/widget/main.jsx`:

```jsx
render(
  <App
    apiKey={params.get('apiKey')}
    theme={params.get('theme')       || 'white-blue'}
    position={params.get('position') || 'bottom-right'}
    lang={params.get('lang')         || 'en'}
    welcomeMessage={params.get('welcomeMessage') || ''}
    accentColor={params.get('accentColor') || ''}
    tagline={params.get('tagline')   || ''}
    mobile={params.get('mobile') === '1'}
  />,
  document.getElementById('app')
)
```

- [ ] **Step 2: Apply accent color and mobile class in App.jsx**

Replace `src/widget/App.jsx` with:

```jsx
// src/widget/App.jsx
import { useState, useEffect } from 'preact/hooks'
import { useTheme } from './hooks/useTheme'
import { applyAccentColor } from './accentColor'
import ChatButton from './components/ChatButton'
import ChatWindow from './components/ChatWindow'

export default function App({ apiKey, theme, position, lang, welcomeMessage, accentColor, tagline, mobile }) {
  const [open, setOpen] = useState(false)
  useTheme(theme)

  useEffect(() => { applyAccentColor(accentColor) }, [accentColor])

  useEffect(() => {
    window.parent.postMessage({
      type:   'chat-widget-resize',
      mode:   open ? 'open' : 'closed',
      width:  open ? 440 : 96,
      height: open ? 638 : 96,
    }, '*')
  }, [open])

  const toggle = () => setOpen(o => !o)

  return (
    <div class={`widget-root position-${position}${mobile ? ' is-mobile' : ''}`}>
      {open && (
        <ChatWindow
          apiKey={apiKey}
          lang={lang}
          tagline={tagline}
          welcomeMessage={welcomeMessage}
          onClose={toggle}
        />
      )}
      <ChatButton open={open} onClick={toggle} />
    </div>
  )
}
```

(Teaser state arrives in Task 6; this task keeps `mode: 'closed'`.)

- [ ] **Step 3: Square AI launcher**

Replace `src/widget/components/ChatButton.jsx`:

```jsx
// src/widget/components/ChatButton.jsx
export default function ChatButton({ open, onClick }) {
  return (
    <button
      class={`chat-launcher${open ? ' chat-launcher--open' : ''}`}
      onClick={onClick}
      aria-label={open ? 'Close chat' : 'Open chat'}
    >
      {open ? '✕' : 'AI'}
    </button>
  )
}
```

- [ ] **Step 4: Launcher styles**

In `src/widget/styles/base.css`, replace the whole `/* ── FAB button ── */` block (`.chat-fab` rules) with:

```css
/* ── Launcher (square "AI" button) ───────────── */
.chat-launcher {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 45%, transparent);
  transition: background 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-launcher:hover { background: var(--accent-hover); transform: scale(1.06); }
.chat-launcher--open { font-size: 22px; font-weight: 500; }
```

Also update the mobile block at the bottom of the file: change the selector `.chat-window,
  .chat-fab` to `.chat-window,
  .chat-launcher`.

- [ ] **Step 5: Verify in browser**

With `npm run dev` running, open `http://localhost:5173/` in the Playwright browser. Expected: rose (#e11d48) rounded square reading "AI" bottom-right; click → window opens and launcher shows ✕; launcher hover scales.

- [ ] **Step 6: Run tests (no regressions)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/widget/main.jsx src/widget/App.jsx src/widget/components/ChatButton.jsx src/widget/styles/base.css
git commit -m "feat: square AI launcher with accent color support"
```

---

### Task 6: Teaser bubble

**Files:**
- Create: `src/widget/components/Teaser.jsx`
- Modify: `src/widget/App.jsx`
- Modify: `src/widget/styles/base.css` (teaser styles)

**Interfaces:**
- Consumes: `getTranslations` (i18n), resize protocol modes from Task 4.
- Produces: `<Teaser message onOpen onDismiss />`; App resolves `resolvedWelcome` and passes it to both Teaser and ChatWindow (ChatWindow's `welcomeMessage` prop is now pre-resolved — Task 7 removes its internal fallback).

- [ ] **Step 1: Teaser component**

Create `src/widget/components/Teaser.jsx`:

```jsx
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
```

- [ ] **Step 2: Wire teaser state into App.jsx**

Replace `src/widget/App.jsx` with:

```jsx
// src/widget/App.jsx
import { useState, useEffect } from 'preact/hooks'
import { useTheme } from './hooks/useTheme'
import { applyAccentColor } from './accentColor'
import { getTranslations } from './i18n'
import ChatButton from './components/ChatButton'
import ChatWindow from './components/ChatWindow'
import Teaser from './components/Teaser'

const TEASER_DISMISS_KEY = 'chat-widget-teaser-dismissed'
const TEASER_DELAY_MS = 3000

function isTeaserDismissed() {
  try { return sessionStorage.getItem(TEASER_DISMISS_KEY) === '1' } catch { return false }
}

function rememberTeaserDismissed() {
  try { sessionStorage.setItem(TEASER_DISMISS_KEY, '1') } catch { /* private mode — teaser will just reappear */ }
}

export default function App({ apiKey, theme, position, lang, welcomeMessage, accentColor, tagline, mobile }) {
  const [open, setOpen] = useState(false)
  const [teaserVisible, setTeaserVisible] = useState(false)
  useTheme(theme)

  useEffect(() => { applyAccentColor(accentColor) }, [accentColor])

  // Customer-supplied welcome text wins; otherwise the built-in translation.
  const resolvedWelcome = welcomeMessage || getTranslations(lang).welcomeMessage

  useEffect(() => {
    if (open || isTeaserDismissed()) return
    const id = setTimeout(() => setTeaserVisible(true), TEASER_DELAY_MS)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    const size = open
      ? { mode: 'open',   width: 440, height: 638 }
      : teaserVisible
        ? { mode: 'teaser', width: 340, height: 172 }
        : { mode: 'closed', width: 96,  height: 96 }
    window.parent.postMessage({ type: 'chat-widget-resize', ...size }, '*')
  }, [open, teaserVisible])

  const dismissTeaser = () => {
    setTeaserVisible(false)
    rememberTeaserDismissed()
  }

  const toggle = () => {
    setOpen(o => !o)
    // Once the visitor has engaged, the teaser has done its job for this session.
    setTeaserVisible(false)
    rememberTeaserDismissed()
  }

  return (
    <div class={`widget-root position-${position}${mobile ? ' is-mobile' : ''}`}>
      {open && (
        <ChatWindow
          apiKey={apiKey}
          lang={lang}
          tagline={tagline}
          welcomeMessage={resolvedWelcome}
          onClose={toggle}
        />
      )}
      {!open && teaserVisible && (
        <Teaser message={resolvedWelcome} onOpen={toggle} onDismiss={dismissTeaser} />
      )}
      <ChatButton open={open} onClick={toggle} />
    </div>
  )
}
```

- [ ] **Step 3: Teaser styles**

In `src/widget/styles/base.css`, add after the launcher block:

```css
/* ── Teaser bubble ───────────────────────────── */
.teaser {
  position: relative;
  max-width: 260px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 14px;
  border-bottom-right-radius: 4px;
  box-shadow: 0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08);
  animation: slideUp 0.25s ease;
}

.teaser-text {
  display: block;
  padding: 12px 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-primary);
  text-align: left;
}

.teaser-close {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.teaser-close:hover { color: var(--text-primary); }

/* Left-anchored positions: dismiss sits on the right, tail flips */
.position-bottom-left .teaser,
.position-top-left .teaser {
  border-bottom-right-radius: 14px;
  border-bottom-left-radius: 4px;
}
.position-bottom-left .teaser-close,
.position-top-left .teaser-close {
  left: auto;
  right: -8px;
}
```

- [ ] **Step 4: Verify in browser**

With dev server running, open a fresh Playwright browser page at `http://localhost:5173/`. Expected: after ~3s a bubble with "Hi, how can I help you?" appears above the AI square (iframe resizes to 340×172). Clicking ✕ hides it; reloading the page does NOT bring it back (sessionStorage). Clear with `sessionStorage.clear()` + reload → teaser returns; clicking the bubble text opens the chat.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/widget/components/Teaser.jsx src/widget/App.jsx src/widget/styles/base.css
git commit -m "feat: proactive teaser bubble with session dismissal"
```

---

### Task 7: Window redesign — size, header tagline, pill input, mic button

**Files:**
- Modify: `src/widget/components/ChatWindow.jsx`
- Modify: `src/widget/components/InputBar.jsx`
- Modify: `src/widget/styles/base.css`

**Interfaces:**
- Consumes: `useChat(apiKey, lang)` (Task 3), i18n keys `voiceComingSoon`/`sendLabel`/`micLabel` (Task 2), pre-resolved `welcomeMessage` prop (Task 6), `is-mobile` root class (Task 5).
- Produces: `<InputBar onSend disabled t />` (takes the whole translations object instead of `placeholder`).

- [ ] **Step 1: ChatWindow — tagline header, lang to useChat, resolved welcome**

Replace `src/widget/components/ChatWindow.jsx`:

```jsx
// src/widget/components/ChatWindow.jsx
import { useChat } from '../hooks/useChat'
import { getTranslations } from '../i18n'
import MessageList from './MessageList'
import InputBar from './InputBar'

export default function ChatWindow({ apiKey, lang, tagline, welcomeMessage, onClose }) {
  const { messages, loading, error, sendMessage } = useChat(apiKey, lang)
  const t = getTranslations(lang)

  return (
    <div class="chat-window" role="dialog" aria-label="Chat">
      <header class="chat-header">
        <div class="chat-header-info">
          <span class="chat-title">{t.chatTitle}</span>
          {tagline && <span class="chat-tagline">{tagline}</span>}
        </div>
        <button class="chat-close" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <MessageList messages={messages} loading={loading} welcomeMessage={welcomeMessage} />
      {error && <div class="chat-error">{t.errorMessage}</div>}
      <InputBar onSend={sendMessage} disabled={loading} t={t} />
    </div>
  )
}
```

- [ ] **Step 2: InputBar — pill input, SVG send, mic with tooltip**

Replace `src/widget/components/InputBar.jsx`:

```jsx
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
```

- [ ] **Step 3: Window + input styles**

In `src/widget/styles/base.css`:

**(a)** In `.chat-window`, change `width: 280px;` → `width: 400px;`, `height: 400px;` → `height: 530px;`, and `box-shadow: var(--shadow);` → `box-shadow: 0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08);`.

**(b)** After the `.chat-title` rule, add:

```css
.chat-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-tagline {
  font-size: 12px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**(c)** Make the input a pill and restyle buttons — replace the `.input-field`, `.send-btn` rules with:

```css
.input-bar { position: relative; }

.input-field {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 100px;
  overflow-y: auto;
  transition: border-color 0.15s;
}
.input-field:focus { border-color: var(--accent); }
.input-field::placeholder { color: var(--text-secondary); }

.mic-btn,
.send-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
}

.mic-btn {
  background: transparent;
  color: var(--text-secondary);
}
.mic-btn:hover { background: var(--bg-secondary); color: var(--accent); }

.send-btn {
  background: var(--accent);
  color: var(--accent-text);
}
.send-btn:hover:not(:disabled) { background: var(--accent-hover); }
.send-btn:active:not(:disabled) { transform: scale(0.95); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.voice-tooltip {
  position: absolute;
  bottom: calc(100% + 4px);
  right: 12px;
  padding: 6px 12px;
  background: var(--text-primary);
  color: var(--bg-primary);
  font-size: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
  animation: slideUp 0.15s ease;
  pointer-events: none;
}
```

Note the existing `.input-bar` rule keeps its flex layout; the new `position: relative` line is an additional rule (CSS cascades, no need to merge blocks).

**(d)** Replace the entire `@media (max-width: 480px)` block at the bottom with `is-mobile` class rules (media queries measure the iframe, not the phone — see Global Constraints):

```css
/* ── Mobile (parent viewport ≤ 480px; loader passes mobile=1) ── */
.widget-root.is-mobile {
  inset: 0 !important;
  width: 100%;
  height: 100%;
  pointer-events: none;
  justify-content: flex-end;
  align-items: stretch;
  padding: 0 20px 20px 0;
}

.widget-root.is-mobile .chat-window {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.widget-root.is-mobile .chat-window,
.widget-root.is-mobile .chat-launcher,
.widget-root.is-mobile .teaser {
  pointer-events: all;
}

.widget-root.is-mobile .chat-launcher,
.widget-root.is-mobile .teaser {
  align-self: flex-end;
}
```

- [ ] **Step 4: Verify in browser**

Dev server + Playwright browser on `http://localhost:5173/`:
1. Open chat → window is 400×530, floats 20px from edges, header shows "Chat with us" + "Your AI assistant" tagline.
2. Input is pill-shaped; mic and round send button present.
3. Click mic → "Voice coming soon" tooltip appears above the bar and fades after ~2s.
4. Send "hello" → user bubble uses accent color #e11d48, mock reply streams in, terminal shows `[mock /api/session] {"apiKey":"pk_test_dev","lang":"en"}` and `[mock /api/chat] {"message":"hello","lang":"en"}`.
5. Resize browser to 400×800, reload, open chat → full-screen window.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/widget/components/ChatWindow.jsx src/widget/components/InputBar.jsx src/widget/styles/base.css
git commit -m "feat: allai-format window with tagline, pill input, and mic button"
```

---

### Task 8: End-to-end verification and build

**Files:**
- No new files; fixes only if verification fails.

- [ ] **Step 1: Full unit test run**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: `dist/loader.js` and `dist/widget/` produced without errors.

- [ ] **Step 3: Playwright E2E sweep against dev server**

With `npm run dev` running, drive `http://localhost:5173/` and verify each spec item:

1. **Launcher:** square, radius 14, reads "AI", colored #e11d48 (accent override active).
2. **Teaser:** appears after 3s with localized welcome; ✕ dismisses; survives reload via sessionStorage; opening chat also suppresses it.
3. **Window:** 400×530, radius 16, 20px margins, header title+tagline, close works, launcher shows ✕ while open.
4. **Lang:** network request bodies for `/api/session` and `/api/chat` include `"lang"`. Also set `data-lang="ro"` on the harness script, reload, and confirm the welcome message is "Bună, cu ce te pot ajuta?" and payloads carry `"lang":"ro"`.
5. **Accent:** remove `data-accent-color` from harness, reload → default blue theme; restore it.
6. **Mic:** tooltip shows and auto-hides; iframe has `allow="microphone"`.
7. **Mobile:** viewport 400×800 → iframe and window go full-screen when open; close returns to launcher.

- [ ] **Step 4: Fix anything that failed, re-verify, commit**

```bash
git add -A
git commit -m "fix: e2e verification fixes for widget redesign"
```

(Skip the commit if nothing needed fixing.)
