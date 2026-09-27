import apiClient from '../../../services/api'

// GET /api/users/me/  (cần header X-User-ID, đã tự động gắn ở apiClient)
export function getProfile() {
  return apiClient.get('/api/users/me/')
}

// PUT /api/users/me/  - chỉ cho sửa name, contact (theo UserUpdateProfileSerializer)
export function updateProfile(payload) {
  return apiClient.put('/api/users/me/', payload)
}

// POST /api/users/change-password/  - body: { old_password, new_password }
export function changePassword(payload) {
  return apiClient.post('/api/users/change-password/', payload)
}
