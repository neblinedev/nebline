import './assets/global.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { initializeMonaco } from '@renderer/components/monaco-editor'

initializeMonaco()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
