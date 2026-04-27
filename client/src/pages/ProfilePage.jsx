import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const FIELD_LABELS = { name: 'Имя', age: 'Возраст', sex: 'Пол', hobby: 'Увлечение' }

export default function ProfilePage() {
  const nav = useNavigate()
  const { logout } = useAuth()

  const [user, setUser]       = useState(null)
  const [status, setStatus]   = useState(null)
  const [form, setForm]       = useState({ name: '', age: '', sex: '', hobby: '' })
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [me, st] = await Promise.all([api.getMe(), api.profileStatus()])
        setUser(me)
        setStatus(st)
        setForm({
          name:  me.name  ?? '',
          age:   me.age   ? String(me.age) : '',
          sex:   me.sex   ?? '',
          hobby: me.hobby ?? '',
        })
      } catch (err) {
        if (err.message.includes('401')) { logout(); nav('/login') }
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const set = (k) => (e) => {
    setSaved(false)
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setSaved(false); setSaving(true)
    try {
      const payload = {
        name:  form.name  || null,
        age:   form.age   ? Number(form.age) : null,
        sex:   form.sex   || null,
        hobby: form.hobby || null,
      }
      const updated = await api.updateMe(payload)
      const st = await api.profileStatus()
      setUser(updated); setStatus(st); setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() { logout(); nav('/login') }

  if (loading) return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center' }}>
        <span className="spinner" /> <span style={{ marginLeft: '.75rem', color: 'var(--text-dim)' }}>Загружаем профиль…</span>
      </div>
    </div>
  )

  const isComplete = status?.is_complete
  const missing    = status?.missing_fields ?? []

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <p className="brand" style={{ marginBottom: 0 }}>✦ {user?.username}</p>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Выйти</button>
        </div>

        <h2 style={{ marginBottom: '.75rem' }}>Мой профиль</h2>

        {/* Profile completeness status */}
        <div className={`profile-status ${isComplete ? 'complete' : 'incomplete'}`}>
          <span>
            {isComplete
              ? '✦ Профиль заполнен — можно создавать сказки'
              : `Заполните профиль перед генерацией`}
          </span>
          {!isComplete && (
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {missing.map(f => (
                <span key={f} className="badge badge-missing">{FIELD_LABELS[f] ?? f}</span>
              ))}
            </div>
          )}
        </div>

        {error  && <div className="alert alert-error">{error}</div>}
        {saved  && <div className="alert alert-success">Профиль обновлён ✦</div>}

        <form onSubmit={handleSave}>
          <div className="fields-grid">
            <div className="field field-full">
              <label>Имя</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Как вас зовут?" maxLength={50} />
            </div>

            <div className="field">
              <label>Возраст</label>
              <input type="number" value={form.age} onChange={set('age')} min={1} max={120} placeholder="Лет" />
            </div>

            <div className="field">
              <label>Пол</label>
              <select value={form.sex} onChange={set('sex')}>
                <option value="">— выберите —</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div className="field field-full">
              <label>Увлечение</label>
              <textarea value={form.hobby} onChange={set('hobby')} placeholder="Что вам интересно?" maxLength={500} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" /> Сохраняем…</> : '✦ Сохранить'}
          </button>
        </form>

        <div className="orn">✦</div>

        <button
          className="btn"
          disabled={!isComplete}
          onClick={() => nav('/tale/new')}
          title={!isComplete ? 'Сначала заполните профиль' : ''}
        >
          ✦ Создать сказку
        </button>
      </div>
    </div>
  )
}
