import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const SIZES = [
  { value: 'tiny',   icon: '🌱', name: 'Крошечная', parts: '3 части' },
  { value: 'small',  icon: '📖', name: 'Маленькая', parts: '5 частей' },
  { value: 'medium', icon: '📚', name: 'Средняя',   parts: '8 частей' },
  { value: 'large',  icon: '🏰', name: 'Большая',   parts: '12 частей' },
]

const GENRES = [
  'Волшебная сказка', 'Приключения', 'Фэнтези', 'Мистика',
  'Детская сказка', 'Легенда', 'Притча', 'Другой',
]

export default function TaleCreatePage() {
  const nav = useNavigate()
  const { userId } = useAuth()

  const [form, setForm] = useState({ name: '', genre: GENRES[0], size: 'small' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Придумайте название сказки')
    setError(''); setLoading(true)
    try {
      await api.createTale(userId, { name: form.name, genre: form.genre, size: form.size })
      nav('/tale')
    } catch (err) {
      // Если 422 с missing_fields — направляем обратно в профиль
      if (err.message.toLowerCase().includes('профиль')) {
        nav('/profile')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520 }}>
        <p className="brand">✦ Новая сказка ✦</p>
        <h2>Создать историю</h2>
        <p className="subtitle">Каждая история уникальна — выберите жанр и размер</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleCreate}>
          <div className="field">
            <label>Название</label>
            <input
              type="text" value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Как назовём историю?" maxLength={100}
            />
          </div>

          <div className="field">
            <label>Жанр</label>
            <select value={form.genre} onChange={e => set('genre')(e.target.value)}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Размер</label>
            <div className="size-grid">
              {SIZES.map(s => (
                <div
                  key={s.value}
                  className={`size-card${form.size === s.value ? ' selected' : ''}`}
                  onClick={() => set('size')(s.value)}
                >
                  <span className="size-icon">{s.icon}</span>
                  <span className="size-name">{s.name}</span>
                  <span className="size-parts">{s.parts}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '.5rem' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Создаём…</> : '✦ Начать сказку'}
          </button>
        </form>

        <div className="orn">✦</div>
        <button className="btn btn-ghost" onClick={() => nav('/profile')}>← Назад в профиль</button>
      </div>
    </div>
  )
}
