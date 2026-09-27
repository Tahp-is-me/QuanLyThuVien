import apiClient from '../../../services/api'

// POST /api/transactions/  -  body: { user_id, items: [{book_id, quantity}] }
// LƯU Ý: dù đã gắn header X-User-ID, backend endpoint này vẫn bắt buộc phải
// có 'user_id' trong body (xem CreateTransactionSerializer) - không tự suy
// ra user từ header. Nên phải truyền tay user_id vào payload.
export function createTransaction(payload) {
  return apiClient.post('/api/transactions/', payload)
}

// GET /api/transactions/me/?user_id=...&status=...
export function getMyTransactions(userId, statusFilter) {
  return apiClient.get('/api/transactions/me/', {
    params: { user_id: userId, status: statusFilter || undefined },
  })
}

// GET /api/transactions/me/:id/  (API public, xem chi tiết theo id)
export function getTransactionDetail(id) {
  return apiClient.get(`/api/transactions/me/${id}/`)
}

// PUT /api/transactions/:id/return-request/
export function requestReturn(id) {
  return apiClient.put(`/api/transactions/${id}/return-request/`)
}

// DELETE /api/transactions/:id/cancel/
export function cancelTransaction(id) {
  return apiClient.delete(`/api/transactions/${id}/cancel/`)
}
