import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Pagination from '../../../components/Pagination'
import StatusBadge from '../../transactions/components/StatusBadge'
import {
  getAllTransactions,
  approveTransaction,
  returnTransaction,
  scanOverdue,
  getUsers,
} from '../api/staffTransactionsApi'
import { listBooks, fetchAll } from '../api/staffCatalogApi'
import { formatDate, formatMoney } from '../../../utils/format'
import { getErrorMessage } from '../../../utils/error'
import {
  calcFine,
  getOverdueDays,
  getTotalBooks,
  isOverdueNow,
  FINE_PER_DAY_PER_BOOK,
} from '../../../utils/fine'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'borrowed', label: 'Đang mượn' },
  { value: 'return_pending', label: 'Chờ duyệt trả' },
  { value: 'returned', label: 'Đã trả' },
  { value: 'overdue', label: 'Quá hạn' },
]

export default function StaffTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [skip, setSkip] = useState(0)

  const [booksMap, setBooksMap] = useState({}) // { [book_id]: { name, quantity } }
  const [usersMap, setUsersMap] = useState({}) // { [user_id]: "Tên (username)" } - chỉ Admin lấy được

  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { type: 'approve' | 'return', transaction }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }, [])

  // Backend chỉ trả book_id / user_id -> tải riêng tên sách + tên độc giả để hiển thị
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
        Object.fromEntries(res.data.map((u) => [u.id, `${u.name || u.username} (${u.username})`])),
      )
    } catch (err) {
      // Staff không có quyền /api/users/ (chỉ Admin) -> fallback "Độc giả #id"
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllTransactions(statusFilter)
      // Backend sắp xếp id tăng dần -> đảo lại để phiếu mới nhất lên đầu
      setTransactions([...res.data].sort((a, b) => b.id - a.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được danh sách phiếu mượn.'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

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
  const readerName = (id) => usersMap[id] || `Độc giả #${id}`

  const pageItems = transactions.slice(skip, skip + PAGE_SIZE)

  return (
    <div>
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
                    <td>{readerName(t.user_id)}</td>
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
                      {['borrowed', 'overdue', 'return_pending'].includes(t.status) && (
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

      <Pagination skip={skip} limit={PAGE_SIZE} total={transactions.length} onChange={setSkip} />

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

function TransactionSummary({ transaction, bookName, readerName }) {
  return (
    <div className="summary-box">
      <p>
        <strong>Phiếu #{transaction.id}</strong> — {readerName(transaction.user_id)}
      </p>
      <ul className="book-list">
        {transaction.details.map((d) => (
          <li key={d.id}>
            {bookName(d.book_id)} × {d.quantity}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Popup xác nhận duyệt phiếu ----------
function ApproveModal({ transaction, bookName, readerName, booksMap, onClose, onDone }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Cảnh báo sớm nếu kho không đủ (backend vẫn là nơi kiểm tra chính thức)
  const shortages = transaction.details.filter(
    (d) => booksMap[d.book_id] && booksMap[d.book_id].quantity < d.quantity,
  )

  async function handleApprove() {
    setSubmitting(true)
    setError('')
    try {
      await approveTransaction(transaction.id)
      onDone(`Đã duyệt phiếu #${transaction.id} — sách đã được trừ khỏi kho.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Duyệt phiếu thất bại.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Xác nhận duyệt phiếu mượn"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary" onClick={handleApprove} disabled={submitting}>
            {submitting ? 'Đang duyệt...' : 'Duyệt phiếu'}
          </button>
        </>
      }
    >
      <TransactionSummary transaction={transaction} bookName={bookName} readerName={readerName} />
      <p className="hint-text">
        Khi duyệt, phiếu chuyển sang “Đang mượn”, hạn trả được tính lại 14 ngày kể từ hôm nay và số
        lượng sách trong kho sẽ bị trừ.
      </p>
      {shortages.length > 0 && (
        <div className="alert alert-warning">
          Kho có thể không đủ:{' '}
          {shortages
            .map((d) => `${bookName(d.book_id)} (còn ${booksMap[d.book_id].quantity}, cần ${d.quantity})`)
            .join('; ')}
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  )
}

// ---------- Popup xác nhận trả sách (hiện ngày mượn/trả + tiền phạt) ----------
function ReturnModal({ transaction, bookName, readerName, onClose, onDone }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const overdueDays = getOverdueDays(transaction.due_date)
  const fine = calcFine(transaction)
  const today = new Date().toISOString().slice(0, 10)

  async function handleReturn() {
    setSubmitting(true)
    setError('')
    try {
      await returnTransaction(transaction.id)
      onDone(
        overdueDays > 0
          ? `Đã ghi nhận trả sách phiếu #${transaction.id}. Tiền phạt thu: ${formatMoney(fine)}.`
          : `Đã ghi nhận trả sách phiếu #${transaction.id}. Trả đúng hạn.`,
      )
    } catch (err) {
      setError(getErrorMessage(err, 'Xác nhận trả sách thất bại.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Xác nhận trả sách"
      onClose={onClose}
      width={500}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary btn-green" onClick={handleReturn} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận đã nhận sách'}
          </button>
        </>
      }
    >
      <TransactionSummary transaction={transaction} bookName={bookName} readerName={readerName} />

      <dl className="info-grid">
        <dt>Ngày mượn</dt>
        <dd>{formatDate(transaction.borrow_date)}</dd>
        <dt>Hạn trả</dt>
        <dd>{formatDate(transaction.due_date)}</dd>
        <dt>Ngày trả (hôm nay)</dt>
        <dd>{formatDate(today)}</dd>
      </dl>

      {overdueDays > 0 ? (
        <div className="alert alert-danger">
          <strong>Quá hạn {overdueDays} ngày.</strong>
          <br />
          Tiền phạt: <strong>{formatMoney(fine)}</strong>
          <span className="hint-text">
            {' '}
            ({overdueDays} ngày × {getTotalBooks(transaction)} cuốn ×{' '}
            {formatMoney(FINE_PER_DAY_PER_BOOK)})
          </span>
        </div>
      ) : (
        <div className="alert alert-success">Trả đúng hạn — không phát sinh tiền phạt.</div>
      )}

      {error && <p className="form-error">{error}</p>}
    </Modal>
  )
}
