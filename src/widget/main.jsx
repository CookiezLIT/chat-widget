// src/widget/main.jsx
import { render } from 'preact'
import App from './App'
import './styles/base.css'
import './styles/themes.css'

// Read config from URL query params (passed by loader.js)
const params = new URLSearchParams(window.location.search)

render(
  <App
    apiKey={params.get('apiKey')}
    theme={params.get('theme') || 'white-blue'}
    position={params.get('position') || 'bottom-right'}
  />,
  document.getElementById('app')
)
