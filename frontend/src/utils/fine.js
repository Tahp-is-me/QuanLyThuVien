// Tính ngày quá hạn / tiền phạt cho phiếu mượn.
// Backend (StaffReturnView) hiện CHƯA trả về tiền phạt, nên FE tự tính để hiện
// trong popup "Xác nhận trả". Mức phạt cần thống nhất lại với Khang.
export const FINE_PER_DAY_PER_BOOK = 5000 // đ / ngày / cuốn

// due_date từ backend dạng "YYYY-MM-DD" -> tách tay để tránh lệch múi giờ
function parseLocalDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayLocal() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Số ngày quá hạn tính đến hôm nay (0 nếu chưa quá hạn)
export function getOverdueDays(dueDate) {
  const due = parseLocalDate(dueDate)
  if (!due) return 0
  const diff = Math.round((todayLocal() - due) / 86400000)
  return Math.max(0, diff)
}

export function getTotalBooks(transaction) {
  return (transaction.details || []).reduce((sum, d) => sum + d.quantity, 0)
}

export function calcFine(transaction) {
  return (
    getOverdueDays(transaction.due_date) *
    getTotalBooks(transaction) *
    FINE_PER_DAY_PER_BOOK
  )
}

// Phiếu đang giữ sách mà đã quá hạn (kể cả khi DB chưa kịp đổi sang 'overdue')
export function isOverdueNow(transaction) {
  return (
    ['borrowed', 'return_pending', 'overdue'].includes(transaction.status) &&
    getOverdueDays(transaction.due_date) > 0
  )
}
