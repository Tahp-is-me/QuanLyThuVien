import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { getAllTransactions } from '../api/staffTransactionsApi'
import { isOverdueNow } from '../../../utils/fine'

// Trang tổng quan Staff (không tự bọc Navbar nữa - đã có StaffLayout lo phần khung)
export default function StaffHomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getAllTransactions()
        const list = res.data
        setStats({
          pending: list.filter((t) => t.status === 'pending').length,
          returnPending: list.filter((t) => t.status === 'return_pending').length,
          borrowed: list.filter((t) => t.status === 'borrowed').length,
          overdue: list.filter((t) => isOverdueNow(t)).length,
        })
      } catch (err) {
        setStats(null)
      }
    }
    load()
  }, [])

  const cards = [
    { label: 'Phiếu chờ duyệt', value: stats?.pending, tone: 'warning' },
    { label: 'Chờ duyệt trả', value: stats?.returnPending, tone: 'purple' },
    { label: 'Đang mượn', value: stats?.borrowed, tone: 'blue' },
    { label: 'Quá hạn', value: stats?.overdue, tone: 'danger' },
  ]

  return (
    <div>
      <h1>Xin chào, {user?.name || user?.username}</h1>
      <p className="hint-text">Khu vực vận hành thư viện dành cho nhân viên.</p>

      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card stat-${c.tone}`}>
            <div className="stat-value">{c.value ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="quick-links">
        <Link to="/staff/transactions" className="quick-link-card">
          🔄 Xử lý mượn / trả
        </Link>
        <Link to="/staff/books" className="quick-link-card">
          📖 Quản lý sách
        </Link>
        <Link to="/staff/authors" className="quick-link-card">
          ✍️ Tác giả
        </Link>
        <Link to="/staff/categories" className="quick-link-card">
          🏷️ Thể loại
        </Link>
      </div>
    </div>
  )
}
