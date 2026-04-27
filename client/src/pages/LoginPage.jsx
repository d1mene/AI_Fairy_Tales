import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const nav      = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const registered = location.state?.registered

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form.username, form.password)
      // получаем user чтобы взять id
      const tempStore = data.access_token
      localStorage.setItem('token', tempStore)
      const me = await api.getMe()
      login(tempStore, me.id)
      nav('/profile')
    } catch (err) {
      localStorage.removeItem('token')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <p className="brand">✦ AI Fairy Tales ✦</p>
        <h2>Добро пожаловать</h2>
        <p className="subtitle">Войдите, чтобы продолжить путь</p>

        {registered && (
          <div className="alert alert-success">
            Регистрация прошла успешно — теперь войдите ✦
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Логин</label>
            <input
              type="text" value={form.username}
              onChange={set('username')} autoComplete="username"
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password" value={form.password}
              onChange={set('password')} autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Входим…</> : '✦ Войти'}
          </button>
        </form>

        <div className="orn">✦</div>
        <p className="link-center">
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
