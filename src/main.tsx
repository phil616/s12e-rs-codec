import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import { BrowserRouter } from 'react-router-dom'
import '@radix-ui/themes/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme accentColor="gray" radius="medium" scaling="95%">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Theme>
  </StrictMode>,
)
