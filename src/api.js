const BASE = 'http://localhost:3001/api'

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function json(method, body) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export default class ApiService {
  getMinis() { return request('/minis') }
  saveMinis(minis) { return request('/minis', json('POST', minis)) }
  addMini(mini) { return request('/minis/add', json('POST', mini)) }
  updateMini(id, mini) { return request(`/minis/${id}`, json('PUT', mini)) }
  deleteMini(id) { return request(`/minis/${id}`, { method: 'DELETE' }) }

  async checkHealth() {
    try {
      const res = await fetch(`${BASE}/health`)
      return res.ok
    } catch { return false }
  }
}
