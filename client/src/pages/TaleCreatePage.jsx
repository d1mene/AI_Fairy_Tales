import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const SIZES = [
  { value: 'tiny',   icon: '🌱', name: 'Крошечная', parts: '3 части' },
  { value: 'small',  icon: '📖', name: 'Маленькая', parts: '8 частей' },
  { value: 'medium', icon: '📚', name: 'Средняя',   parts: '16 частей' },
  { value: 'large',  icon: '🏰', name: 'Большая',   parts: '32 части' },
]

const GENRES = [
  'Волшебная сказка', 'Приключения', 'Фэнтези', 'Мистика',
  'Детская сказка', 'Легенда', 'Притча', 'Другой',
]

const STATUS = {
  idle:      null,
  creating:  'Создаём сказку…',
  starting:  'Генерируем первую часть…',
}

export default function TaleCreatePage() {
  const nav = useNavigate()
  const { userId } = useAuth()

  const [form, setForm]   = useState({ name: '', genre: GENRES[0], size: 'small' })
  const [phase, setPhase] = useState('idle')   // 'idle' | 'creating' | 'starting'
  const [error, setError] = useState('')

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))
  const loading = phase !== 'idle'

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Придумайте название сказки')
    setError('')

    try {
      // 1. Создаём сказку
      setPhase('creating')
      await api.createTale(userId, { name: form.name, genre: form.genre, size: form.size })

      // 2. Сразу отправляем стартовое сообщение — AI генерирует первую часть
      setPhase('starting')
      await api.addMessage(userId, 'Начни историю')

      // 3. Переходим в чат — первая часть уже готова
      nav('/tale')
    } catch (err) {
      setPhase('idle')
      if (err.message.toLowerCase().includes('профиль')) {
        nav('/profile')
      } else {
        setError(err.message)
      }
    }
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520 }}>
        <p className="brand">✦ Новая сказка ✦</p>
        <h2>Создать историю</h2>
        <p className="subtitle">Каждая история уникальна — выберите жанр и размер</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Статус генерации */}
        {loading && (
          <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span className="spinner" />
            {STATUS[phase]}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="field">
            <label>Название</label>
            <input
              type="text" value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Как назовём историю?" maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Жанр</label>
            <select value={form.genre} onChange={e => set('genre')(e.target.value)} disabled={loading}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Размер</label>
            <div className="size-grid">
              {SIZES.map(s => (
                <div
                  key={s.value}
                  className={`size-card${form.size === s.value ? ' selected' : ''}${loading ? ' disabled' : ''}`}
                  onClick={() => !loading && set('size')(s.value)}
                  style={loading ? { pointerEvents: 'none', opacity: .5 } : {}}
                >
                  <span className="size-icon">{s.icon}</span>
                  <span className="size-name">{s.name}</span>
                  <span className="size-parts">{s.parts}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '.5rem' }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> {STATUS[phase]}</>
              : '✦ Начать сказку'}
          </button>
        </form>

        <div className="orn">✦</div>
        <button className="btn btn-ghost" onClick={() => nav('/profile')} disabled={loading}>
          ← Назад в профиль
        </button>
      </div>
    </div>
  )
}
