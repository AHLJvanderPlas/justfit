import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import ErrorBoundary from './ErrorBoundary.jsx'
import Announcer from './Announcer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Announcer />
  </StrictMode>,
)
