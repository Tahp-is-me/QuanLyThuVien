import { useState } from 'react'
import Modal from '../../../components/Modal'
import { approveTransaction, returnTransaction } from '../api/staffTransactionsApi'
import { formatDate, formatMoney } from '../../../utils/format'
import { getErrorMessage } from '../../../utils/error'
import {
  calcFine,
  getOverdueDays,
  getTotalBooks,
  FINE_PER_DAY_PER_BOOK,
} from '../../../utils/fine'

// Tóm tắt phiếu dùng chung cho 2 popup
function TransactionSummary({ transaction, bookName, readerName }) {
  return (
    <div className="summary-box">
      <p>
        <strong>Phiếu #{transaction.id}</strong> — {readerName(transaction)}
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
export function ApproveModal({ transaction, bookName, readerName, booksMap, onClose, onDone }) {
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
export function ReturnModal({ transaction, bookName, readerName, onClose, onDone }) {
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
