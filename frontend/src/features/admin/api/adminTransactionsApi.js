import apiClient from '../../../services/api'

export function getAllTransactions(status = '') {
  return apiClient.get('/api/transactions/', {
    params: { status: status || undefined },
  })
}

export function approveTransaction(id) {
  return apiClient.put(`/api/transactions/${id}/approve/`)
}

export function returnTransaction(id) {
  return apiClient.put(`/api/transactions/${id}/return/`)
}

export function scanOverdue() {
  return apiClient.post('/api/transactions/scan-overdue/')
}