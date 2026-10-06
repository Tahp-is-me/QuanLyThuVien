// Gom cách đọc lỗi từ backend (DRF) về 1 chỗ để các trang Staff/Admin dùng chung.
// Backend trả lỗi theo nhiều dạng: { error }, { detail }, hoặc { field: ["msg"] }.

export function getErrorMessage(err, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (!err?.response) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa.'
  }
  if (err.response.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }
  const data = err.response.data
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error
    if (typeof data.detail === 'string') return data.detail
    const first = Object.values(data)[0]
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    if (typeof first === 'string') return first
  }
  return fallback
}

// Lỗi validate theo từng field: { name: "Tên sách đã tồn tại.", quantity: "..." }
export function getFieldErrors(err) {
  const data = err?.response?.data
  const result = {}
  if (!data || typeof data !== 'object' || Array.isArray(data)) return result
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value) && typeof value[0] === 'string') result[key] = value[0]
    else if (typeof value === 'string' && key !== 'error' && key !== 'detail') result[key] = value
  })
  return result
}
