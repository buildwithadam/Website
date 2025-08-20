import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import BugHunter from './BugHunter.jsx'
import Lab from './Lab.jsx'
import { inject } from '@vercel/analytics'
inject()

const path = window.location.pathname
const RootComponent = path.startsWith('/bug-hunter') ? BugHunter : path.startsWith('/lab') ? Lab : App

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RootComponent />
    </React.StrictMode>
)
