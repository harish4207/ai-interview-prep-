import React from 'react'
import { BrowserRouter as Router , Route , Routes } from 'react-router-dom'

import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Home/Dashboard'
import InterviewPrep from './pages/InterviewPrep/InterviewPrep'
import UserProvider from './context/userContext'
export default function App() {
  return (
    <UserProvider>
    <div >
    
      <Router>
  <Routes>
    {/* Default Route */}
    <Route path="/" element={<LandingPage />} />

 
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/interview-prep/:sessionId" element={<InterviewPrep />} />
  </Routes>
</Router>
    </div>
    </UserProvider>
  )
}
