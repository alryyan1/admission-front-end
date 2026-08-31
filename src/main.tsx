import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './lib/dayjs'
import './index.css'
import App from './App.tsx'

window.Buffer = window.Buffer || Buffer

document.documentElement.setAttribute('dir', 'rtl')
document.documentElement.setAttribute('lang', 'ar')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
