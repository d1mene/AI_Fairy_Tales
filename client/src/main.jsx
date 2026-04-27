import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Stars from './components/Stars'

import RegisterPage  from './pages/RegisterPage'
import LoginPage     from './pages/LoginPage'
import ProfilePage   from './pages/ProfilePage'
import TaleCreatePage from './pages/TaleCreatePage'
import TaleChatPage  from './pages/TaleChatPage'

import './index.css'

function Protected({ children }) {
  const { isAuth } = useAuth()
  return isAuth ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Stars count={90} />
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/profile"  element={<Protected><ProfilePage /></Protected>} />
        <Route path="/tale/new" element={<Protected><TaleCreatePage /></Protected>} />
        <Route path="/tale"     element={<Protected><TaleChatPage /></Protected>} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
