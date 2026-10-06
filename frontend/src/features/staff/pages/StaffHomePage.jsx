import { useCallback, useEffect, useState } from 'react'
import Pagination from '../../../components/Pagination'
import StatusBadge from '../../transactions/components/StatusBadge'
import { ApproveModal, ReturnModal } from '../components/TransactionModals'
import { getAllTransactions, scanOverdue, getUsers } from '../api/staffTransactionsApi'
import { listBooks, fetchAll } from '../api/staffCatalogApi'
import { formatDate } from '../../../utils/format'
import { getErrorMessage } from '../../../utils/error'
import { getOverdueDays, isOverdueNow } from '../../../utils/fine'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'borrowed', label: 'Đang mượn' },
  { value: 'return_pending', label: 'Chờ duyệt trả' },
  { value: 'returned', label: 'Đã trả' },
  { value: 'overdue', label: 'Quá hạn' },
]

// Trang chính của Staff: 4 ô thống kê + danh sách quản lý phiếu mượn / trả
// (đã gộp từ 2 trang "Tổng quan" và "Phiếu mượn / trả" cũ).
export default function StaffHomePage() {
  const [transactions, setTransactions] = useState([]) // toàn bộ phiếu, lọc ở phía FE
  const [statusFilter, setStatusFilter] = useState('')
  const [skip, setSkip] = useState(0)

  const [booksMap, setBooksMap] = useState({}) // { [book_id]: { name, quantity } }
  const [usersMap, setUsersMap] = useState({}) // dự phòng nếu backend chưa trả user_name (chỉ Admin lấy được)

  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { type: 'approve' | 'return', transaction }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }, [])

  const loadLookups = useCallback(async () => {
    try {
      const books = await fetchAll(listBooks)
      setBooksMap(Object.fromEntries(books.map((b) => [b.id, { name: b.name, quantity: b.quantity }])))
    } catch (err) {
      // không chặn trang, chỉ hiện "Sách #id"
    }
    try {
      const res = await getUsers()
      setUsersMap(
        Object.fromEntries(res.data.map((u) => [u.id, u.name || u.username])),
      )
    } catch (err) {
      // Staff không có quyền /api/users/ -> dùng user_name do backend trả kèm phiếu
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllTransactions()
      // Backend sắp xếp id tăng dần -> đảo lại để phiếu mới nhất lên đầu
      setTransactions([...res.data].sort((a, b) => b.id - a.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được danh sách phiếu mượn.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLookups()
    loadTransactions()
  }, [loadLookups, loadTransactions])

  async function handleScanOverdue() {
    setScanning(true)
    setError('')
    try {
      const res = await scanOverdue()
      showToast(`Đã quét xong: ${res.data.updated_count} phiếu được chuyển sang quá hạn.`)
      loadTransactions()
    } catch (err) {
      setError(getErrorMessage(err, 'Quét phiếu quá hạn thất bại.'))
    } finally {
      setScanning(false)
    }
  }

  function afterAction(msg) {
    setModal(null)
    showToast(msg)
    loadTransactions()
    loadLookups() // tồn kho đã thay đổi sau khi duyệt/trả
  }

  const bookName = (id) => booksMap[id]?.name || `Sách #${id}`
  // Ưu tiên tên do backend trả kèm phiếu (user_name), sau đó tới danh sách user (Admin)
  const readerName = (t) => t.user_name || usersMap[t.user_id] || `Độc giả #${t.user_id}`

  const stats = [
    { label: 'Phiếu chờ duyệt', value: transactions.filter((t) => t.status === 'pending').length, tone: 'warning' },
    { label: 'Chờ duyệt trả', value: transactions.filter((t) => t.status === 'return_pending').length, tone: 'purple' },
    { label: 'Đang mượn', value: transactions.filter((t) => t.status === 'borrowed').length, tone: 'blue' },
    { label: 'Quá hạn', value: transactions.filter((t) => isOverdueNow(t)).length, tone: 'danger' },
  ]

  const filtered = statusFilter
    ? transactions.filter((t) => t.status === statusFilter)
    : transactions
  const pageItems = filtered.slice(skip, skip + PAGE_SIZE)

  return (
    <div>
      <div className="stat-grid">
        {stats.map((c) => (
          <div key={c.label} className={`stat-card stat-${c.tone}`}>
            <div className="stat-value">{loading ? '—' : c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <h1>Quản lý phiếu mượn / trả</h1>
        <div className="row-actions">
          <button className="btn-secondary" onClick={loadTransactions} disabled={loading}>
            ↻ Làm mới
          </button>
          <button className="btn-secondary" onClick={handleScanOverdue} disabled={scanning}>
            {scanning ? 'Đang quét...' : 'Quét phiếu quá hạn'}
          </button>
        </div>
      </div>

      <div className="filter-row">
        <label>
          Lọc theo trạng thái:{' '}
          <select
            value={statusFilter}
            onChange={(e) => {
              setSkip(0)
              setStatusFilter(e.target.value)
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {toast && <div className="toast">{toast}</div>}
      {error && <p className="form-error">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Phiếu</th>
              <th>Độc giả</th>
              <th>Sách mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Ngày trả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  Đang tải...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  Không có phiếu mượn nào.
                </td>
              </tr>
            ) : (
              pageItems.map((t) => {
                const late = isOverdueNow(t)
                return (
                  <tr key={t.id} className={late ? 'row-overdue' : ''}>
                    <td>
                      <strong>#{t.id}</strong>
                    </td>
                    <td>{readerName(t)}</td>
                    <td>
                      <ul className="book-list">
                        {t.details.map((d) => (
                          <li key={d.id}>
                            {bookName(d.book_id)} × {d.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{formatDate(t.borrow_date)}</td>
                    <td>{formatDate(t.due_date)}</td>
                    <td>{t.return_date ? formatDate(t.return_date) : '—'}</td>
                    <td>
                      <div className="badge-stack">
                        <StatusBadge status={t.status} />
                        {late && (
                          <span className="overdue-text">Quá {getOverdueDays(t.due_date)} ngày</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {t.status === 'pending' && (
                        <button
                          className="btn-primary"
                          onClick={() => setModal({ type: 'approve', transaction: t })}
                        >
                          Duyệt
                        </button>
                      )}
                      {/* Chỉ xác nhận trả khi độc giả đã gửi yêu cầu trả (return_pending) */}
                      {t.status === 'return_pending' && (
                        <button
                          className="btn-primary btn-green"
                          onClick={() => setModal({ type: 'return', transaction: t })}
                        >
                          Xác nhận trả
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={PAGE_SIZE} total={filtered.length} onChange={setSkip} />

      {modal?.type === 'approve' && (
        <ApproveModal
          transaction={modal.transaction}
          bookName={bookName}
          readerName={readerName}
          booksMap={booksMap}
          onClose={() => setModal(null)}
          onDone={afterAction}
        />
      )}

      {modal?.type === 'return' && (
        <ReturnModal
          transaction={modal.transaction}
          bookName={bookName}
          readerName={readerName}
          onClose={() => setModal(null)}
          onDone={afterAction}
        />
      )}
    </div>
  )
}
