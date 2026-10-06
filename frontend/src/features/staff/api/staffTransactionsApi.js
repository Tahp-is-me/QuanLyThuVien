import apiClient from '../../../services/api'

// GET /api/transactions/?status=...  -> mảng tất cả phiếu (backend không phân trang)
export function getAllTransactions(status) {
  return apiClient.get('/api/transactions/', { params: { status: status || undefined } })
}

// PUT /api/transactions/:id/approve/  (pending -> borrowed, trừ kho)
export function approveTransaction(id) {
  return apiClient.put(`/api/transactions/${id}/approve/`)
}

// PUT /api/transactions/:id/return/  (borrowed/overdue/return_pending -> returned, cộng lại kho)
export function returnTransaction(id) {
  return apiClient.put(`/api/transactions/${id}/return/`)
}

// POST /api/transactions/scan-overdue/  (gắn cờ overdue cho phiếu quá hạn)
export function scanOverdue() {
  return apiClient.post('/api/transactions/scan-overdue/')
}

// GET /api/users/  - CHỈ Admin gọi được. Staff sẽ bị 403 -> trang tự fallback "Độc giả #id".
export function getUsers() {
  return apiClient.get('/api/users/')
}
