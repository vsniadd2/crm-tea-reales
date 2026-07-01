import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from './NotificationProvider'
import { getRememberMePreference, setRememberMePreference } from '../utils/authStorage'
import Footer from './Footer'
import './Login.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(getRememberMePreference)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showNotification } = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!username.trim() || !password) return

    setLoading(true)
    const result = await login(username, password, rememberMe)

    if (!result.success) {
      showNotification(result.error, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-page">
        <div className="login-panel">
          <div className="login-brand">
            <div className="login-brand-mark" aria-hidden="true">
              <svg className="login-brand-cup" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 19h16v2H4zM20 8V5h-2v3zm0-5c.6 0 1 .2 1.4.6s.6.9.6 1.4v3c0 .6-.2 1-.6 1.4s-.8.6-1.4.6h-2v3c0 1.1-.4 2-1.2 2.8S15.1 17 14 17H8c-1.1 0-2-.4-2.8-1.2S4 14.1 4 13V3h5v2.4L7.2 6.8c-.1.1-.2.3-.2.4v4.3c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5V7.2c0-.2-.1-.3-.2-.4L10 5.4V3z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="login-brand-text">Tea</span>
          </div>
          <div className="login-subtitle">Введите логин и пароль для входа в систему</div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field login-field--username">
              <input
                type="text"
                autoComplete="username"
                placeholder="Логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="login-field login-field--password">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M10.58 10.58A2 2 0 0012 15a2 2 0 001.41-3.41" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.02 2.28-2.78 4.18-5 5.35M6.11 6.11C3.6 7.67 1.82 10.19 1 13c1.73 3.89 6 7 11 7 1.05 0 2.06-.14 3-.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12C3.73 8.11 8 5 12 5s8.27 3.11 10 7c-1.73 3.89-6 7-10 7S3.73 15.89 2 12Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
                  </svg>
                )}
              </button>
            </div>

            <div className="login-row">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setRememberMe(checked)
                    setRememberMePreference(checked)
                  }}
                  disabled={loading}
                />
                <span>Запомнить меня</span>
              </label>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Login
