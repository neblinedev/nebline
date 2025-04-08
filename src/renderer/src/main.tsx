import './assets/global.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ProjectProvider } from './contexts/ProjectContext' // Import the provider

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </React.StrictMode>
)
