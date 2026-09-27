import { useEffect, useState } from 'react'
import Navbar from '../../../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../../../hooks/useAuth'
import {
  getMyTransactions,
  requestReturn,
  cancelTransaction,
} from '../api/transactionsApi'
import { getBookDetail } from '../../books/api/booksApi'
import { formatDate } from '../../../utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'borrowed', label: 'Đang mượn' },
  { value: 'return_pending', label: 'Chờ duyệt trả' },
  { value: 'returned', label: 'Đã trả' },
  { value: 'overdue', label: 'Quá hạn' },
]

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [bookNames, setBookNames] = useState({}) // { [book_id]: name }
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  async function loadTransactions() {
    setLoading(true)
    setError('')
    try {
      const res = await getMyTransactions(user.id, statusFilter)
      setTransactions(res.data)
      await loadBookNames(res.data)
    } catch (err) {
      setError('Không tải được lịch sử mượn sách.')
    } finally {
      setLoading(false)
    }
  }

  // Backend chỉ lưu book_id trong transaction detail, không kèm tên sách,
  // nên phải gọi riêng API chi tiết sách để lấy tên hiển thị.
  // Nếu sách đã hết hàng (status != available) thì API trả 404 với Reader,
  // lúc đó chỉ hiện "Sách #id (không khả dụng)".
  async function loadBookNames(transactionList) {
    const uniqueBookIds = new Set()
    transactionList.forEach((t) => t.details.forEach((d) => uniqueBookIds.add(d.book_id)))

    const idsToFetch = [...uniqueBookIds].filter((id) => !(id in bookNames))
    if (idsToFetch.length === 0) return

    const results = await Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const res = await getBookDetail(id)
          return [id, res.data.name]
        } catch (err) {
          return [id, null]
        }
      }),
    )

    setBookNames((prev) => {
      const updated = { ...prev }
      results.forEach(([id, name]) => {
        updated[id] = name
      })
      return updated
    })
  }

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleCancel(id) {
    if (!confirm('Xác nhận hủy phiếu mượn này?')) return
    try {
      await cancelTransaction(id)
      setActionMsg('Đã hủy phiếu mượn.')
      loadTransactions()
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Hủy phiếu thất bại.')
    }
  }

  async function handleReturnRequest(id) {
    try {
      await requestReturn(id)
      setActionMsg('Đã gửi yêu cầu trả sách, chờ nhân viên duyệt.')
      loadTransactions()
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Gửi yêu cầu trả thất bại.')
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-content wide">
        <h1>Lịch sử mượn sách</h1>

        <div className="filter-row">
          <label>
            Lọc theo trạng thái:{' '}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {actionMsg && <div className="toast">{actionMsg}</div>}
        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p>Đang tải...</p>
        ) : transactions.length === 0 ? (
          <p>Chưa có phiếu mượn nào.</p>
        ) : (
          <div className="transaction-list">
            {transactions.map((t) => (
              <div key={t.id} className="transaction-card">
                <div className="transaction-card-header">
                  <span>Phiếu #{t.id}</span>
                  <StatusBadge status={t.status} />
                </div>
                <p>Ngày mượn: {formatDate(t.borrow_date)}</p>
                <p>Hạn trả: {formatDate(t.due_date)}</p>
                {t.return_date && <p>Ngày trả: {formatDate(t.return_date)}</p>}

                <ul className="transaction-details-list">
                  {t.details.map((d) => (
                    <li key={d.id}>
                      {bookNames[d.book_id] || `Sách #${d.book_id} (không khả dụng)`} — SL:{' '}
                      {d.quantity}
                    </li>
                  ))}
                </ul>

                <div className="transaction-actions">
                  {t.status === 'pending' && (
                    <button className="btn-danger" onClick={() => handleCancel(t.id)}>
                      Hủy phiếu
                    </button>
                  )}
                  {(t.status === 'borrowed' || t.status === 'overdue') && (
                    <button className="btn-secondary" onClick={() => handleReturnRequest(t.id)}>
                      Yêu cầu trả sách
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
