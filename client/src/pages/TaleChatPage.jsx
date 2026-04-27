import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function TaleChatPage() {
  const nav = useNavigate()
  const { userId } = useAuth()

  const [tale, setTale]       = useState(null)
  const [messages, setMessages] = useState([])   // {role:'bot'|'user', text, part?}
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError]     = useState('')

  const bottomRef = useRef(null)

  // ── Load current tale ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const t = await api.getCurrentTale(userId)
        setTale(t)

        // Rebuild messages from saved content array
        const msgs = []
        t.content.forEach((entry, i) => {
          msgs.push({ role: 'bot',  text: entry.assistant_response ?? entry.response ?? '', part: i + 1 })
          if (entry.user_message) {
            msgs.push({ role: 'user', text: entry.user_message })
          }
        })
        setMessages(msgs)
      } catch (err) {
        if (err.message.includes('404')) nav('/tale/new')
        else setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ───────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    setError('')

    setMessages(m => [...m, { role: 'user', text }])

    try {
      const res = await api.addMessage(userId, text)

      setMessages(m => [...m, {
        role: 'bot',
        text: res.response,
        part: res.stage,
      }])

      if (res.is_completed) {
        setTale(t => ({ ...t, current_stage: res.stage, is_completed: true }))
      } else {
        setTale(t => ({ ...t, current_stage: res.stage }))
      }
    } catch (err) {
      setError(err.message)
      setMessages(m => m.slice(0, -1)) // remove optimistic user message
    } finally {
      setSending(false)
    }
  }

  // ── Complete tale ─────────────────────────────────────────
  async function handleComplete() {
    setCompleting(true); setError('')
    try {
      await api.completeTale(userId)
      setTale(t => ({ ...t, is_completed: true }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Computed ───────────────────────────────────────────────
  const stage     = tale?.current_stage ?? 0
  const totalParts = tale?.size ?? 1
  const progress  = Math.min(stage / totalParts, 1)
  const isCompleted = tale?.is_completed

  if (loading) return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center' }}>
        <span className="spinner" />
        <span style={{ marginLeft: '.75rem', color: 'var(--text-dim)' }}>Загружаем сказку…</span>
      </div>
    </div>
  )

  return (
    <div className="chat-layout">

      {/* Header */}
      <div className="chat-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="chat-title">{tale?.name ?? 'Сказка'}</div>
          <div className="chat-meta">{tale?.genre}</div>
        </div>

        <div className="progress-wrap" style={{ minWidth: 160 }}>
          <span>{stage} / {totalParts}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => nav('/profile')}>← Профиль</button>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '2rem', fontStyle: 'italic' }}>
            ✦ Напишите что-нибудь, чтобы начать историю ✦
          </div>
        )}

        {messages.map((msg, i) => {
          const showPartLabel = msg.role === 'bot' && msg.part != null
          return (
            <div key={i}>
              {showPartLabel && (
                <div className="part-sep">Часть {msg.part}</div>
              )}
              <div className={`msg msg-${msg.role}`}>
                <div className="msg-label">
                  {msg.role === 'bot' ? '✦ Рассказчик' : 'Вы'}
                </div>
                <div className="bubble">{msg.text}</div>
              </div>
            </div>
          )
        })}

        {sending && (
          <div className="msg msg-bot">
            <div className="msg-label">✦ Рассказчик</div>
            <div className="bubble streaming">Сочиняет</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Completed */}
      {isCompleted ? (
        <div className="tale-done">
          <h3>✦ Конец ✦</h3>
          <p>История завершена. Спасибо, что были частью этого путешествия.</p>
          <button className="btn btn-primary" onClick={() => nav('/tale/new')}>
            ✦ Новая сказка
          </button>
        </div>
      ) : (
        /* Input */
        <div className="chat-input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ваш ответ рассказчику… (Enter — отправить)"
            disabled={sending}
            maxLength={500}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            {sending ? <span className="spinner" /> : '✦'}
          </button>

          {stage >= totalParts && (
            <button
              className="btn btn-sm"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? <span className="spinner" /> : 'Завершить'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
