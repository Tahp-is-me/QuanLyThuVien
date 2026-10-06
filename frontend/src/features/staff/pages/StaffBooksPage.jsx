import { useCallback, useEffect, useMemo, useState } from 'react'
import BookFilters from '../../books/components/BookFilters'
import Modal from '../../../components/Modal'
import Pagination from '../../../components/Pagination'
import {
  listBooks,
  listAuthors,
  listCategories,
  createBook,
  updateBook,
  deleteBook,
  quickUpdateBookQuantity,
  fetchAll,
} from '../api/staffCatalogApi'
import { formatDate } from '../../../utils/format'
import { getErrorMessage, getFieldErrors } from '../../../utils/error'

const PAGE_SIZE = 10

export default function StaffBooksPage() {
  const [books, setBooks] = useState([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [filters, setFilters] = useState({ name: '', author_id: '', category_id: '' })
  const [visibility, setVisibility] = useState('') // '' | 'true' | 'false'

  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])

  const [qtyDraft, setQtyDraft] = useState({}) // { [bookId]: "12" } - ô nhập nhanh số lượng
  const [savingQtyId, setSavingQtyId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { type: 'form' | 'delete', book }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  // Tác giả + thể loại: lấy toàn bộ 1 lần để làm dropdown lọc, dropdown form và tra tên
  useEffect(() => {
    async function loadLookups() {
      try {
        const [a, c] = await Promise.all([fetchAll(listAuthors), fetchAll(listCategories)])
        setAuthors(a)
        setCategories(c)
      } catch (err) {
        setError(getErrorMessage(err, 'Không tải được danh sách tác giả/thể loại.'))
      }
    }
    loadLookups()
  }, [])

  const authorsMap = useMemo(() => Object.fromEntries(authors.map((a) => [a.id, a])), [authors])
  const categoriesMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { skip, limit: PAGE_SIZE }
      if (filters.name) params.name = filters.name
      if (filters.author_id) params.author_id = filters.author_id
      if (filters.category_id) params.category_id = filters.category_id
      if (visibility) params.is_public = visibility
      const res = await listBooks(params)
      setBooks(res.data.results)
      setTotal(res.data.count)
      setQtyDraft({})
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được danh sách sách.'))
    } finally {
      setLoading(false)
    }
  }, [skip, filters, visibility])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Chỉ tìm khi bấm nút "Tìm kiếm" (BookFilters đã làm đúng yêu cầu không real-time)
  function handleFilterChange(newFilters) {
    setSkip(0)
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  async function handleQuickUpdate(book) {
    const value = qtyDraft[book.id]
    const quantity = Number(value)
    if (value === '' || !Number.isInteger(quantity) || quantity < 0) {
      setError('Số lượng phải là số nguyên không âm.')
      return
    }
    setSavingQtyId(book.id)
    setError('')
    try {
      const res = await quickUpdateBookQuantity(book.id, quantity)
      const updated = res.data.data
      setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)))
      setQtyDraft((prev) => {
        const next = { ...prev }
        delete next[book.id]
        return next
      })
      showToast(`Đã cập nhật tồn kho "${book.name}": ${quantity} cuốn.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Cập nhật số lượng thất bại.'))
    } finally {
      setSavingQtyId(null)
    }
  }

  async function handleRestore(book) {
    try {
      await updateBook(book.id, { ...book, is_public: true })
      showToast(`Đã khôi phục sách "${book.name}".`)
      loadBooks()
    } catch (err) {
      setError(getErrorMessage(err, 'Khôi phục thất bại.'))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý sách</h1>
        <button className="btn-primary" onClick={() => setModal({ type: 'form', book: null })}>
          + Thêm sách
        </button>
      </div>

      <BookFilters authors={authors} categories={categories} onFilterChange={handleFilterChange} />

      <div className="filter-row">
        <label>
          Hiển thị:{' '}
          <select
            value={visibility}
            onChange={(e) => {
              setSkip(0)
              setVisibility(e.target.value)
            }}
          >
            <option value="">Tất cả</option>
            <option value="true">Đang công khai</option>
            <option value="false">Đã ẩn (xóa mềm)</option>
          </select>
        </label>
      </div>

      {toast && <div className="toast">{toast}</div>}
      {error && <p className="form-error">{error}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên sách</th>
              <th>Tác giả</th>
              <th>Thể loại</th>
              <th>Ngày phát hành</th>
              <th>Tồn kho (cập nhật nhanh)</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  Đang tải...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  Không tìm thấy sách phù hợp.
                </td>
              </tr>
            ) : (
              books.map((book) => {
                const draft = qtyDraft[book.id]
                const changed = draft !== undefined && String(draft) !== String(book.quantity)
                return (
                  <tr key={book.id} className={book.is_public ? '' : 'row-hidden'}>
                    <td>{book.id}</td>
                    <td>
                      {book.image_url ? (
                        <img className="thumb" src={book.image_url} alt={book.name} />
                      ) : (
                        <div className="thumb thumb-empty">📖</div>
                      )}
                    </td>
                    <td>
                      <strong>{book.name}</strong>
                    </td>
                    <td>{authorsMap[book.author]?.name || `#${book.author}`}</td>
                    <td>{categoriesMap[book.category]?.name || `#${book.category}`}</td>
                    <td>{formatDate(book.public_date)}</td>
                    <td>
                      <div className="inline-qty">
                        <input
                          type="number"
                          min={0}
                          value={draft ?? book.quantity}
                          onChange={(e) =>
                            setQtyDraft((prev) => ({ ...prev, [book.id]: e.target.value }))
                          }
                        />
                        <button
                          className="btn-secondary"
                          disabled={!changed || savingQtyId === book.id}
                          onClick={() => handleQuickUpdate(book)}
                        >
                          {savingQtyId === book.id ? '...' : 'Lưu'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="badge-stack">
                        <span
                          className={`status-badge ${
                            book.status === 'available' ? 'badge-returned' : 'badge-overdue'
                          }`}
                        >
                          {book.status === 'available' ? 'Còn sách' : 'Hết sách'}
                        </span>
                        {!book.is_public && <span className="status-badge badge-default">Đã ẩn</span>}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setModal({ type: 'form', book })}
                        >
                          Sửa
                        </button>
                        {book.is_public ? (
                          <button
                            className="btn-danger"
                            onClick={() => setModal({ type: 'delete', book })}
                          >
                            Xóa
                          </button>
                        ) : (
                          <button className="btn-secondary" onClick={() => handleRestore(book)}>
                            Khôi phục
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={PAGE_SIZE} total={total} onChange={setSkip} />

      {modal?.type === 'form' && (
        <BookFormModal
          book={modal.book}
          authors={authors}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null)
            showToast(msg)
            loadBooks()
          }}
        />
      )}

      {modal?.type === 'delete' && (
        <DeleteBookModal
          book={modal.book}
          onClose={() => setModal(null)}
          onDeleted={(msg) => {
            setModal(null)
            showToast(msg)
            loadBooks()
          }}
        />
      )}
    </div>
  )
}

// ---------- Modal Thêm / Sửa sách ----------
function BookFormModal({ book, authors, categories, onClose, onSaved }) {
  const isEdit = Boolean(book)
  const [form, setForm] = useState({
    name: book?.name || '',
    author: book?.author ?? '',
    category: book?.category ?? '',
    quantity: book?.quantity ?? 0,
    public_date: book?.public_date || '',
    image_url: book?.image_url || '',
    is_public: book ? book.is_public : true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Backend chỉ cho chọn tác giả/thể loại đang công khai. Khi sửa sách mà
  // tác giả hiện tại đã bị ẩn thì vẫn hiện lại trong dropdown (kèm nhãn) để không mất dữ liệu.
  const authorOptions = authors.filter((a) => a.is_public || a.id === book?.author)
  const categoryOptions = categories.filter((c) => c.is_public || c.id === book?.category)

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên sách.'
    if (form.author === '') errs.author = 'Vui lòng chọn tác giả.'
    if (form.category === '') errs.category = 'Vui lòng chọn thể loại.'
    const q = Number(form.quantity)
    if (form.quantity === '' || !Number.isInteger(q) || q < 0) {
      errs.quantity = 'Số lượng phải là số nguyên không âm.'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload = {
      name: form.name.trim(),
      author: Number(form.author),
      category: Number(form.category),
      quantity: Number(form.quantity),
      public_date: form.public_date || null,
      image_url: form.image_url.trim() || null,
      is_public: form.is_public,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateBook(book.id, payload)
        onSaved(`Đã cập nhật sách "${payload.name}".`)
      } else {
        await createBook(payload)
        onSaved(`Đã thêm sách "${payload.name}".`)
      }
    } catch (err) {
      const fe = getFieldErrors(err)
      setFieldErrors(fe)
      if (Object.keys(fe).length === 0) setError(getErrorMessage(err, 'Lưu sách thất bại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Sửa sách' : 'Thêm sách'}
      onClose={onClose}
      width={560}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" form="book-form" className="btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </>
      }
    >
      <form id="book-form" className="auth-form" onSubmit={handleSubmit}>
        <label>
          Tên sách *
          <input
            type="text"
            value={form.name}
            maxLength={255}
            onChange={(e) => setField('name', e.target.value)}
          />
          {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
        </label>

        <div className="form-grid">
          <label>
            Tác giả *
            <select value={form.author} onChange={(e) => setField('author', e.target.value)}>
              <option value="">-- Chọn tác giả --</option>
              {authorOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.is_public ? '' : ' (đã ẩn)'}
                </option>
              ))}
            </select>
            {fieldErrors.author && <span className="form-error">{fieldErrors.author}</span>}
          </label>

          <label>
            Thể loại *
            <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
              <option value="">-- Chọn thể loại --</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_public ? '' : ' (đã ẩn)'}
                </option>
              ))}
            </select>
            {fieldErrors.category && <span className="form-error">{fieldErrors.category}</span>}
          </label>

          <label>
            Số lượng *
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setField('quantity', e.target.value)}
            />
            {fieldErrors.quantity && <span className="form-error">{fieldErrors.quantity}</span>}
          </label>

          <label>
            Ngày phát hành
            <input
              type="date"
              value={form.public_date}
              onChange={(e) => setField('public_date', e.target.value)}
            />
            {fieldErrors.public_date && <span className="form-error">{fieldErrors.public_date}</span>}
          </label>
        </div>

        <label>
          Link ảnh bìa
          <input
            type="text"
            placeholder="https://..."
            value={form.image_url}
            maxLength={500}
            onChange={(e) => setField('image_url', e.target.value)}
          />
        </label>

        <p className="hint-text">
          Trạng thái “Còn sách / Hết sách” tự động theo số lượng (0 = hết sách).
        </p>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setField('is_public', e.target.checked)}
          />
          Công khai (độc giả nhìn thấy)
        </label>

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}

// ---------- Modal Xóa mềm sách ----------
function DeleteBookModal({ book, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await deleteBook(book.id)
      onDeleted(`Đã ẩn (xóa mềm) sách "${book.name}".`)
    } catch (err) {
      // VD: chỉ được xóa khi sách đang 'available' và chưa có lịch sử mượn/trả
      setError(getErrorMessage(err, 'Xóa sách thất bại.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="Xóa sách"
      onClose={onClose}
      width={440}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary btn-red" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </>
      }
    >
      <p>
        Bạn chắc chắn muốn xóa sách <strong>{book.name}</strong>?
      </p>
      <p className="hint-text">
        Xóa mềm: sách chuyển sang “Đã ẩn”. Chỉ xóa được khi sách đang còn (available) và chưa từng
        được mượn/trả.
      </p>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  )
}
