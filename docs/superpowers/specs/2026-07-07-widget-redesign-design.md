# Chat Widget Redesign — Design Spec

**Date:** 2026-07-07
**Status:** Approved
**Scope:** Restyle within the current architecture (loader + sandboxed iframe + Preact). No backend changes beyond the request payload contract; no new server endpoints.

## Background

Competitive reference: allai.ro's widget (loader script + iframe, 400×526 window, 16px radius, floating with margins, round animated-robot launcher + teaser bubble, quick-reply chips, SSE streaming from an Apache/PHP/Express stack). We adopt its size/format and teaser pattern, with our own square "AI" launcher and accent-based theming.

## 1. Launcher (closed state)

- 56×56px rounded square, border-radius 14px, filled with `--accent`, displaying **AI** in bold (accent-text color), soft accent-tinted shadow, subtle hover scale (~1.06).
- Replaces the current 💬 emoji circle (`ChatButton.jsx`).
- **Teaser bubble:** appears 3s after load, beside the launcher, showing the localized welcome message (the same string the chat opens with — `data-welcome-message` or i18n fallback).
  - Small ✕ dismiss control; dismissal stored in `sessionStorage` (per-tab session, mirrors allai.ro's approach).
  - Hidden permanently once the chat has been opened this session.
- **Iframe sizing (via existing `chat-widget-resize` postMessage):**
  - Closed, no teaser: ~72×72
  - Closed, teaser visible: ~340×140
  - Open: per section 2.

## 2. Window (open state)

- 400×530px, border-radius 16px, floating at 20px from screen edges (not flush to the corner as today).
- Shadow: `0 8px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08)`.
- Header: bot title (`chatTitle` i18n) + optional one-line tagline via new `data-tagline` attribute; close button.
- Body: message list (unchanged behavior; streaming SSE as today).
- Footer: pill-shaped input, icon-only send button, mic button (section 5).
- **Mobile (<480px viewport):** full-screen takeover; keep current mobile close-button behavior.

## 3. Theming

- Keep the 4 preset themes (`white-blue`, `black-blue`, `white-green`, `black-green`).
- New `data-accent-color="#hex"` loader attribute → passed to the widget via query param.
  - When present, JS computes and sets on the root: `--accent`, `--accent-hover` (~12% darker), `--bubble-user`, launcher fill, and the accent-tinted shadow.
  - `--accent-text` / `--bubble-user-text` derived by contrast check (white or near-black, whichever passes).
  - `data-theme` still selects the light/dark base palette; accent only overrides accent-derived variables.
- Invalid hex → ignored with console warning, preset theme stands.

## 4. Language

- Resolution order unchanged (loader): `data-lang` → `<html lang>` → `navigator.language` → `en`.
- i18n.js remains the source of UI strings (en, ro, hu, fr, de). New keys: `voiceComingSoon`, `sendLabel`, `micLabel`. The teaser bubble reuses the existing `welcomeMessage` string (no separate key).
- **Backend contract change (useChat.js):**
  - `POST /api/session` body: `{ apiKey, lang }`
  - `POST /api/chat` body: `{ message, lang }`
- First assistant message = `data-welcome-message` if provided, else i18n `welcomeMessage` for the resolved lang (unchanged).

## 5. Voice button

- Mic icon button in the input bar, always visible, placed left of send.
- Tap → localized "Voice coming soon" tooltip above the button, auto-fades after ~2s.
- Loader adds `allow="microphone"` to the iframe **now**, so client embed codes won't need to change when voice ships.

## 6. Error handling

- Unchanged chat error flow (localized `errorMessage`).
- New failure modes: invalid `data-accent-color` (warn + fallback), `sessionStorage` unavailable (teaser simply reappears per load — acceptable).

## 7. Testing

- Vite dev server with the existing development mock.
- Playwright checks: launcher renders (square, "AI"), teaser appears/dismisses/persists dismissal, open/close resizes iframe correctly, window dimensions/radius/shadow, `lang` present in `/api/session` and `/api/chat` request bodies, `data-accent-color` recolors launcher/bubbles/buttons, mic tooltip shows and fades, mobile full-screen layout.

## Out of scope (deliberate)

- Server-driven config endpoint, per-page teaser texts, session history restore, quick-reply chips, tracking/attribution — all possible later without rework.
