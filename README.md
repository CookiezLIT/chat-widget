# Chat Widget

A standalone embeddable chat widget distributed as an npm package. Customers embed it with a single `<script>` tag — it injects a sandboxed iframe that runs the Preact UI. No framework dependency on the host site.

---

## Embed (customer-facing)

```html
<script
  src="https://cookiezlit.github.io/chat-widget/loader.js"
  data-api-key="YOUR_API_KEY"
  data-theme="white-blue"
  data-position="bottom-right">
</script>
```

### Embed attributes

| Attribute | Required | Values | Default |
|---|---|---|---|
| `data-api-key` | Yes | Your public API key | — |
| `data-theme` | No | `white-blue` `black-blue` `white-green` `black-green` | `white-blue` |
| `data-position` | No | `bottom-right` `bottom-left` `top-right` `top-left` | `bottom-right` |

> The widget UI is served from the same location as `loader.js` — no extra configuration needed.

---

## Development

```bash
npm install
npm run dev       # http://localhost:5173 — live Preact app with mock API
npm run build     # produces dist/
```

In dev mode, `/api/session` and `/api/chat` are intercepted by a Vite plugin and return mock responses — no backend needed. Set `VITE_BACKEND_URL` in `.env.development` to point at a real backend instead.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_BACKEND_URL` | Base URL for API calls. Empty string = relative (dev mock). Set to your backend origin for production. |

---

## Project structure

```
src/
├── loader.js                 # Vanilla IIFE — what <script> loads (~1 KB)
└── widget/
    ├── index.html            # iframe host page
    ├── main.jsx              # Preact entry — reads URL params, mounts App
    ├── App.jsx               # Root: manages open/close state, postMessages loader
    ├── components/
    │   ├── ChatButton.jsx    # Floating action button (FAB)
    │   ├── ChatWindow.jsx    # Chat panel shell (header + message list + input)
    │   ├── MessageList.jsx   # Scrollable history, auto-scrolls on new messages
    │   ├── MessageBubble.jsx # Single message bubble (user or assistant)
    │   └── InputBar.jsx      # Textarea + send button, Enter to submit
    ├── hooks/
    │   ├── useChat.js        # Session init, message state, streaming reader
    │   └── useTheme.js       # Applies data-theme attr to <html>
    └── styles/
        ├── base.css          # Reset, layout, components, animations
        └── themes.css        # Four color themes as CSS variable sets
```

### How the iframe bridge works

1. `loader.js` derives the widget base URL from its own `src` attribute (same directory)
2. It creates a `position: fixed` iframe pointing at `{baseUrl}/widget?apiKey=…&theme=…&position=…`
3. The iframe is always interactive (`pointer-events: all`) — no postMessage coordination needed

---

## Backend contract

The widget makes exactly two API calls. Both go to `VITE_BACKEND_URL` (or relative `/api/...` in dev).

### 1. POST /api/session

Called once, on first message send. Exchanges the public API key for a short-lived session JWT.

**Request**
```
POST /api/session
Content-Type: application/json

{ "apiKey": "pk_live_abc123" }
```

The backend should also validate the `Origin` header against the customer's domain allowlist here — this is the main security gate.

**Response — 200 OK**
```json
{ "token": "<short-lived-jwt>" }
```

**Response — 4xx**
Any non-2xx response causes the widget to show "Something went wrong." and stop.

---

### 2. POST /api/chat

Called on every message. Sends the user's text and receives a **streaming plain-text response**.

**Request**
```
POST /api/chat
Content-Type: application/json
Authorization: Bearer <session-jwt>

{ "message": "Hello, what can you help me with?" }
```

**Response — 200 OK, streamed**

The widget reads the response body as a `ReadableStream` using the Fetch API's streaming reader. The backend must:

- Return `200` immediately (do **not** buffer the full reply)
- Write plain UTF-8 text chunks as they are generated
- Close the stream when done

```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked

Hello! I can help you with...    ← chunk 1
 billing, account settings...    ← chunk 2
 and technical support.          ← chunk 3
                                 ← stream closed
```

The widget appends each chunk directly to the message bubble as it arrives — there is no SSE envelope, no `data:` prefix, no JSON wrapping. Raw text only.

> **Note:** The current client does not send conversation history — only the latest message is sent per request. If you need multi-turn context, the backend must reconstruct it from the session JWT or a server-side session store.

**Response — 4xx / 5xx**
Any non-2xx response causes the widget to show "Something went wrong." The partial message bubble is removed.

---

## Themes

| Value | Background | Accent |
|---|---|---|
| `white-blue` | White | Blue |
| `black-blue` | Dark | Blue |
| `white-green` | White | Green |
| `black-green` | Dark | Green |

Themes are implemented as CSS custom property sets on `[data-theme="…"]` in `src/widget/styles/themes.css`. The `useTheme` hook applies the value to `document.documentElement` on mount.

---

## Build & publish

```bash
npm run build

# Output:
# dist/loader.js          — tiny IIFE, upload to your CDN
# dist/widget/            — full Preact app, serve from your domain at /widget

npm publish --access public
```

The `files` field in `package.json` ensures only `dist/` is published.

---

## Security notes

| Concern | How it's handled |
|---|---|
| API key visible in HTML | It's a public key only — AI secrets stay on the backend |
| Domain allowlisting | Backend validates `Origin` on `/api/session` |
| iframe sandbox | `allow-scripts allow-forms allow-same-origin` — no top navigation, no popups |
| postMessage origin check | Not used — iframe communication removed in favour of always-on pointer events |
| CSP on widget page | `src/widget/index.html` restricts scripts, styles, and connect targets |
| Session tokens | Short-lived JWTs issued per session, not stored beyond the page lifetime |
