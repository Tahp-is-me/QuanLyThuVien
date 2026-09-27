import apiClient from '../../../services/api'

// POST /api/users/register/
// payload: { username, password, name, contact }
export function registerReader(payload) {
  return apiClient.post('/api/users/register/', payload)
}

// POST /api/users/login/
// payload: { username, password }
// response.data.user = { id, username, name, role }
export function loginUser(payload) {
  return apiClient.post('/api/users/login/', payload)
}
