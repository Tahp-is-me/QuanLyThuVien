import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Pagination from '../../../components/Pagination'
import { getErrorMessage, getFieldErrors } from '../../../utils/error'

const PAGE_SIZE = 10

// Bảng CRUD dùng chung cho Tác giả & Thể loại (2 màn hình giống nhau ~90%).
//
// Props:
//  - title, noun: "Quản lý tác giả", "tác giả"
//  - api: { list, create, update, remove }  (từ staffCatalogApi.js)
//  - extraColumns: [{ key, label, render(item) }]
//  - extraFields: [{ name, label, options: [{value,label}] }]  (select thêm trong form)
export default function CatalogManager({
  title,
  noun,
  api,
  extraColumns = [],
  extraFields = [],
}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [visibility, setVisibility] = useState('') // '' | 'true' | 'false'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [modal, setModal] = useState(null) // { type: 'form' | 'delete', item }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { skip, limit: PAGE_SIZE }
      if (visibility) params.is_public = visibility
      const res = await api.list(params)
      setItems(res.data.results)
      setTotal(res.data.count)
    } catch (err) {
      setError(getErrorMessage(err, `Không tải được danh sách ${noun}.`))
    } finally {
      setLoading(false)
    }
  }, [api, skip, visibility, noun])

  useEffect(() => {
    load()
  }, [load])

  async function handleRestore(item) {
    try {
      await api.update(item.id, { ...item, is_public: true })
      showToast(`Đã khôi phục ${noun} "${item.name}".`)
      load()
    } catch (err) {
      setError(getErrorMessage(err, 'Khôi phục thất bại.'))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <button className="btn-primary" onClick={() => setModal({ type: 'form', item: null })}>
          + Thêm {noun}
        </button>
      </div>

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
            <option value="false">Đã ẩn</option>
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
              <th>Tên {noun}</th>
              {extraColumns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5 + extraColumns.length} className="table-empty">
                  Đang tải...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5 + extraColumns.length} className="table-empty">
                  Chưa có {noun} nào.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={item.is_public ? '' : 'row-hidden'}>
                  <td>{item.id}</td>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  {extraColumns.map((c) => (
                    <td key={c.key}>{c.render(item)}</td>
                  ))}
                  <td className="cell-describe">{item.describe || '—'}</td>
                  <td>
                    <span className={`status-badge ${item.is_public ? 'badge-returned' : 'badge-default'}`}>
                      {item.is_public ? 'Công khai' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => setModal({ type: 'form', item })}
                      >
                        Sửa
                      </button>
                      {item.is_public ? (
                        <button
                          className="btn-danger"
                          onClick={() => setModal({ type: 'delete', item })}
                        >
                          Xóa
                        </button>
                      ) : (
                        <button className="btn-secondary" onClick={() => handleRestore(item)}>
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={PAGE_SIZE} total={total} onChange={setSkip} />

      {modal?.type === 'form' && (
        <CatalogFormModal
          noun={noun}
          item={modal.item}
          api={api}
          extraFields={extraFields}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null)
            showToast(msg)
            load()
          }}
        />
      )}

      {modal?.type === 'delete' && (
        <DeleteModal
          noun={noun}
          item={modal.item}
          api={api}
          onClose={() => setModal(null)}
          onDeleted={(msg) => {
            setModal(null)
            showToast(msg)
            load()
          }}
        />
      )}
    </div>
  )
}

// ---------- Modal Thêm / Sửa ----------
function CatalogFormModal({ noun, item, api, extraFields, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(() => {
    const base = {
      name: item?.name || '',
      describe: item?.describe || '',
      is_public: item ? item.is_public : true,
    }
    extraFields.forEach((f) => {
      base[f.name] = item?.[f.name] ?? ''
    })
    return base
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!form.name.trim()) {
      setFieldErrors({ name: `Vui lòng nhập tên ${noun}.` })
      return
    }

    const payload = { name: form.name.trim(), describe: form.describe, is_public: form.is_public }
    extraFields.forEach((f) => {
      payload[f.name] = form[f.name] === '' ? null : Number(form[f.name])
    })

    setSaving(true)
    try {
      if (isEdit) {
        await api.update(item.id, payload)
        onSaved(`Đã cập nhật ${noun} "${payload.name}".`)
      } else {
        await api.create(payload)
        onSaved(`Đã thêm ${noun} "${payload.name}".`)
      }
    } catch (err) {
      const fe = getFieldErrors(err)
      setFieldErrors(fe)
      if (Object.keys(fe).length === 0) setError(getErrorMessage(err, 'Lưu thất bại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Sửa ${noun}` : `Thêm ${noun}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" form="catalog-form" className="btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </>
      }
    >
      <form id="catalog-form" className="auth-form" onSubmit={handleSubmit}>
        <label>
          Tên {noun} *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            maxLength={100}
          />
          {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
        </label>

        {extraFields.map((f) => (
          <label key={f.name}>
            {f.label}
            <select value={form[f.name]} onChange={(e) => setField(f.name, e.target.value)}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {fieldErrors[f.name] && <span className="form-error">{fieldErrors[f.name]}</span>}
          </label>
        ))}

        <label>
          Mô tả
          <textarea
            rows={3}
            value={form.describe}
            onChange={(e) => setField('describe', e.target.value)}
          />
        </label>

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

// ---------- Modal Xóa mềm ----------
function DeleteModal({ noun, item, api, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await api.remove(item.id)
      onDeleted(`Đã ẩn (xóa mềm) ${noun} "${item.name}".`)
    } catch (err) {
      // VD: "Không thể xóa vì tác giả này đang có sách trong hệ thống."
      setError(getErrorMessage(err, 'Xóa thất bại.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      title={`Xóa ${noun}`}
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
        Bạn chắc chắn muốn xóa {noun} <strong>{item.name}</strong>?
      </p>
      <p className="hint-text">
        Đây là xóa mềm: {noun} chuyển sang trạng thái “Đã ẩn”, có thể khôi phục lại sau.
      </p>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  )
}
