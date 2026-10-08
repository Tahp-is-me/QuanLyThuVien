import apiClient from '../../../services/api'

// Quản lý tài khoản - backend hiện tại chỉ cho Admin gọi các API này.
export function getUsers(params = {}) {
  return apiClient.get('/api/users/', { params })
}

export function getReaders(params = {}) {
  return getUsers({ role: 'reader', ...params })
}

export function getUserDetail(id) {
  return apiClient.get(`/api/users/${id}/`)
}

export function toggleUserStatus(id) {
  return apiClient.put(`/api/users/${id}/toggle-status/`)
}

export function changeUserRole(id, role) {
  return apiClient.put(`/api/users/${id}/change-role/`, { role })
}