import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

// ── PDF / print helpers ────────────────────────────────────────
function buildPrintHtml(tale, messages) {
  const parts = messages
    .filter(m => m.role === 'bot')
    .map((m, i) => `<div class="part"><h2>Часть ${i + 1}</h2><p>${m.text.replace(/\n/g, '<br>')}</p></div>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${tale.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Cinzel:wght@600&display=swap');
  body { font-family:'EB Garamond',Georgia,serif; max-width:680px; margin:3rem auto; color:#1a1a1a; line-height:1.75; }
  h1   { font-family:'Cinzel',serif; text-align:center; font-size:1.8rem; margin-bottom:.3rem; }
  .meta{ text-align:center; color:#666; font-style:italic; margin-bottom:2.5rem; }
  .part{ margin-bottom:2rem; }
  h2   { font-family:'Cinzel',serif; font-size:1rem; letter-spacing:.15em; color:#555; margin-bottom:.5rem; }
  p    { margin:0; }
  @media print { body { margin:1.5cm; } }
</style>
</head>
<body>
  <h1>${tale.name}</h1>
  <p class="meta">${tale.genre} &nbsp;·&nbsp; ${messages.filter(m=>m.role==='bot').length} частей</p>
  ${parts}
</body>
</html>`
}

function downloadHtml(tale, messages) {
  const html = buildPrintHtml(tale, messages)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${tale.name}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function openPrintWindow(tale, messages) {
  const html = buildPrintHtml(tale, messages)
  const win  = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)   // ждём загрузки шрифтов
}

// ── Component ──────────────────────────────────────────────────
export default function TaleChatPage() {
  const nav = useNavigate()
  const { userId } = useAuth()

  const [tale, setTale]         = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError]       = useState('')

  const bottomRef = useRef(null)

  // Порядковый номер части среди бот-сообщений
  function botIndex(msgs, i) {
    return msgs.slice(0, i + 1).filter(m => m.role === 'bot').length
  }

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const t = await api.getCurrentTale(userId)
        setTale(t)

        const msgs = []
        t.content.forEach((entry) => {
          if (entry.assistant_response) {
            msgs.push({ role: 'bot', text: entry.assistant_response })
          }
          // Скрываем стартовый триггер
          if (entry.user_message && entry.user_message !== 'Начни историю') {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // ── Send ──────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput(''); setSending(true); setError('')

    setMessages(m => [...m, { role: 'user', text }])

    try {
      const res = await api.addMessage(userId, text)
      setMessages(m => [...m, { role: 'bot', text: res.response }])
      setTale(t => ({ ...t, current_stage: res.stage, is_completed: res.is_completed }))
    } catch (err) {
      setError(err.message)
      setMessages(m => m.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

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

  const totalParts  = tale?.size ?? 1
  const stage       = tale?.current_stage ?? 0
  const progress    = Math.min(stage / totalParts, 1)
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

      {error && <div className="alert alert-error">{error}</div>}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isBot  = msg.role === 'bot'
          const partNum = isBot ? botIndex(messages, i) : null
          return (
            <div key={i}>
              {isBot && <div className="part-sep">Часть {partNum}</div>}
              <div className={`msg msg-${msg.role}`}>
                <div className="msg-label">{isBot ? '✦ Рассказчик' : 'Вы'}</div>
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

      {/* Footer */}
      {isCompleted ? (
        /* ── Завершение ── */
        <div className="tale-done">
          <h3>✦ Конец истории ✦</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            История завершена. Сохраните её, чтобы перечитать позже.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: 360, margin: '0 auto' }}>
            {/* PDF через браузерный print */}
            <button
              className="btn btn-primary"
              onClick={() => openPrintWindow(tale, messages)}
            >
              🖨 Сохранить как PDF
            </button>

            {/* HTML-файл с вёрсткой */}
            <button
              className="btn"
              onClick={() => downloadHtml(tale, messages)}
            >
              📄 Скачать как HTML
            </button>

            <div className="orn">✦</div>

            <button className="btn btn-ghost" onClick={() => nav('/tale/new')}>
              ✦ Начать новую сказку
            </button>
          </div>
        </div>
      ) : (
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
