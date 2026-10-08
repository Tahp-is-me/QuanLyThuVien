import { useCallback, useEffect, useMemo, useState } from 'react'
import { changeUserRole, getUsers, getUserDetail, toggleUserStatus } from '../api/adminApi'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [workingId, setWorkingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getUsers()
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(getApiError(err, 'Không thể tải danh sách độc giả.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? Number(user.is_public) === 1 : Number(user.is_public) === 0)
      if (!matchesRole || !matchesStatus) return false
      if (!keyword) return true
      return [user.username, user.name, user.contact].some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [users, search, statusFilter, roleFilter])

  const roleCounts = useMemo(() => {
    return {
      admin: users.filter((user) => user.role === 'admin').length,
      staff: users.filter((user) => user.role === 'staff').length,
      reader: users.filter((user) => user.role === 'reader').length,
    }
  }, [users])

  async function handleDetail(id) {
    try {
      setDetailLoading(true)
      setError('')
      const res = await getUserDetail(id)
      setSelectedUser(res.data)
    } catch (err) {
      setError(getApiError(err, 'Không thể lấy thông tin tài khoản.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleToggle(user) {
    const action = Number(user.is_public) === 1 ? 'khóa' : 'mở khóa'
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.username}" không?`)) return

    try {
      setWorkingId(user.id)
      setError('')
      const res = await toggleUserStatus(user.id)
      const updated = res.data?.user
      setUsers((current) => current.map((item) => item.id === user.id ? (updated || { ...item, is_public: Number(item.is_public) === 1 ? 0 : 1 }) : item))
      setSelectedUser((current) => current?.id === user.id ? (updated || current) : current)
      setMessage(res.data?.message || `Đã ${action} tài khoản.`)
    } catch (err) {
      setError(getApiError(err, `Không thể ${action} tài khoản.`))
    } finally {
      setWorkingId(null)
    }
  }

  async function handlePromote(user) {
    if (!window.confirm(`Chuyển "${user.username}" từ Reader thành Staff?`)) return

    try {
      setWorkingId(user.id)
      setError('')
      const res = await changeUserRole(user.id, 'staff')
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setSelectedUser(null)
      setMessage(res.data?.message || 'Đã chuyển tài khoản thành Staff.')
    } catch (err) {
      setError(getApiError(err, 'Không thể thay đổi quyền tài khoản.'))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý tài khoản</h1>
          <p>Quản lý tài khoản, phân quyền và trạng thái hoạt động.</p>
        </div>
        <button className="admin-btn primary" onClick={loadUsers}>↻ Làm mới</button>
      </div>

      <div className="admin-account-summary">
        <div className="admin-account-total">
          <span>TỔNG TÀI KHOẢN</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-role-summary">
          <div>
            <span className="admin-role-dot administrator"></span>
            <span>Administrator</span>
            <strong>{roleCounts.admin}</strong>
          </div>

          <div>
            <span className="admin-role-dot staff"></span>
            <span>Staff</span>
            <strong>{roleCounts.staff}</strong>
          </div>

          <div>
            <span className="admin-role-dot reader"></span>
            <span>Reader</span>
            <strong>{roleCounts.reader}</strong>
          </div>
        </div>

        <div className="admin-filtered-count">
          Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản
        </div>
      </div>

      <section className="admin-card admin-user-card">
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm username, họ tên hoặc liên hệ..." />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="reader">Reader</option>
            <option value="staff">Staff</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tài khoản</th>
                <th>Họ tên</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="align-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="admin-empty">Đang tải danh sách...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="7" className="admin-empty">Không tìm thấy tài khoản phù hợp.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td><strong>{user.username}</strong><div className="admin-role-label">{user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Reader'}</div></td>
                  <td>{user.name || '—'}</td>
                  <td>{user.contact || '—'}</td>
                  <td><StatusBadge active={Number(user.is_public) === 1} /></td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-action view" onClick={() => handleDetail(user.id)}>Xem</button>
                      <button className={`admin-action ${Number(user.is_public) === 1 ? 'lock' : 'unlock'}`} disabled={workingId === user.id} onClick={() => handleToggle(user)}>
                        {Number(user.is_public) === 1 ? 'Khóa' : 'Mở khóa'}
                      </button>
                      {user.role === 'reader' && <button className="admin-action promote" disabled={workingId === user.id} onClick={() => handlePromote(user)}>→ Staff</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedUser(null)}>
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div><span className="admin-modal-kicker">CHI TIẾT TÀI KHOẢN</span><h2>{selectedUser.name || selectedUser.username}</h2></div>
              <button onClick={() => setSelectedUser(null)} className="admin-modal-close">×</button>
            </div>
            {detailLoading ? <div className="admin-empty">Đang tải...</div> : <UserDetail user={selectedUser} />}
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ active }) {
  return <span className={`admin-status ${active ? 'active' : 'locked'}`}><i />{active ? 'Hoạt động' : 'Đã khóa'}</span>
}

function UserDetail({ user }) {
  return (
    <div className="admin-detail-grid">
      <DetailItem label="ID" value={`#${user.id}`} />
      <DetailItem label="Username" value={user.username} />
      <DetailItem label="Họ tên" value={user.name || 'Chưa cập nhật'} />
      <DetailItem label="Liên hệ" value={user.contact || 'Chưa cập nhật'} />
      <DetailItem label="Vai trò" value={user.role === 'reader' ? 'Độc giả' : user.role} />
      <DetailItem label="Trạng thái" value={<StatusBadge active={Number(user.is_public) === 1} />} />
      <DetailItem label="Ngày tạo" value={formatDate(user.created_at)} />
    </div>
  )
}

function DetailItem({ label, value }) {
  return <div className="admin-detail-item"><span>{label}</span><strong>{value}</strong></div>
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function getApiError(error, fallback) {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data?.error) return data.error
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0]
    if (Array.isArray(first)) return first[0]
    if (typeof first === 'string') return first
  }
  return fallback
}
