const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(method, path, body, formEncoded = false) {
  const headers = formEncoded
    ? { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) }
    : authHeaders()

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formEncoded
      ? body                         // URLSearchParams
      : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = `Ошибка ${res.status}`
    try {
      const err = await res.json()
      detail = typeof err.detail === 'string'
        ? err.detail
        : err.detail?.message ?? JSON.stringify(err.detail)
    } catch {}
    throw new Error(detail)
  }

  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

// ── Auth ──────────────────────────────────────────────────────
export const api = {
  register(username, password) {
    return request('POST', '/register', { username, password })
  },

  login(username, password) {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return request('POST', '/login', form, true)
  },

  // ── Profile ─────────────────────────────────────────────────
  getMe() {
    return request('GET', '/profile/me')
  },

  updateMe(data) {
    return request('PUT', '/profile/me', data)
  },

  profileStatus() {
    return request('GET', '/profile/me/status')
  },

  // ── Tales ────────────────────────────────────────────────────
  createTale(userId, data) {
    return request('POST', `/tales/${userId}/create`, data)
  },

  getCurrentTale(userId) {
    return request('GET', `/tales/${userId}/current`)
  },

  addMessage(userId, message) {
    return request('POST', `/tales/${userId}/add`, { message })
  },

  completeTale(userId) {
    return request('POST', `/tales/${userId}/complete`)
  },
}
