import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../api/dashboardApi'
import { scanOverdue } from '../api/adminTransactionsApi'

const initialStats = {
  totalBooks: 0,
  totalReaders: 0,
  totalTransactions: 0,
  totalOverdue: 0,
}

export default function AdminHomePage() {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Không thể tải dữ liệu Dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  async function handleScanOverdue() {
    try {
      setMessage('')
      setError('')
      const res = await scanOverdue()
      setMessage(res.data?.message || 'Đã kiểm tra phiếu quá hạn.')
      await loadStats()
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể kiểm tra phiếu quá hạn.')
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan tình hình hoạt động của thư viện.</p>
        </div>
        <div className="admin-heading-actions">
          <button className="admin-btn secondary" onClick={handleScanOverdue}>Kiểm tra quá hạn</button>
          <button className="admin-btn primary" onClick={loadStats}>↻ Làm mới</button>
        </div>
      </div>

      {message && <div className="admin-alert success">{message}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <div className="admin-stat-grid">
        <StatCard icon="📚" label="Tổng số sách" value={stats.totalBooks} loading={loading} />
        <StatCard icon="👥" label="Tổng độc giả" value={stats.totalReaders} loading={loading} />
        <StatCard icon="🧾" label="Tổng phiếu mượn" value={stats.totalTransactions} loading={loading} />
        <StatCard icon="⚠️" label="Phiếu quá hạn" value={stats.totalOverdue} loading={loading} danger />
      </div>

      <div className="admin-card-grid">
        <section className="admin-card admin-welcome-card">
          <div className="admin-card-icon">🛠️</div>
          <div>
            <h2>Quản trị hệ thống</h2>
            <p>Quản lý tài khoản, phân quyền và theo dõi số liệu thư viện tại đây.</p>
            <Link className="admin-text-link" to="/admin/users">Đi đến quản lý tài khoản →</Link>
          </div>
        </section>

        <section className="admin-card admin-welcome-card">
          <div className="admin-card-icon">📚</div>
            <div>
              <h2>Quản lý thư viện</h2>
              <p>Quản lý sách, phiếu mượn trả và các nghiệp vụ thư viện thông qua khu vực Staff.</p>
              <Link className="admin-text-link" to="/admin/library">Đi đến quản lý thư viện →</Link>
            </div>
        </section>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, loading, danger }) {
  return (
    <div className={`admin-stat-card${danger ? ' danger' : ''}`}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-info">
        <span>{label}</span>
        <strong>{loading ? '...' : value}</strong>
      </div>
    </div>
  )
}
