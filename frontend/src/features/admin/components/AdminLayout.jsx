import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import './admin.css'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `admin-sidebar-link${isActive ? ' active' : ''}`

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">📚</div>
          <div>
            <strong>Thư viện</strong>
            <span>ADMIN</span>
          </div>
        </div>

        <div className="admin-menu-title">QUẢN TRỊ</div>

        <nav className="admin-menu">
          <NavLink to="/admin" end className={linkClass}>
            <span>📊</span> Dashboard
          </NavLink>

          <NavLink to="/admin/users" className={linkClass}>
            <span>👥</span> Quản lý tài khoản
          </NavLink>

          <NavLink to="/admin/library" className={linkClass}>
            <span>📖</span> Quản lý thư viện
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            className="admin-sidebar-link admin-logout"
            onClick={handleLogout}
          >
            <span>↪</span> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-header-title">Trang quản trị</div>
            <div className="admin-header-subtitle">
              Quản lý hệ thống thư viện
            </div>
          </div>

          <div className="admin-account">
            <div className="admin-avatar">
              {(user?.name || user?.username || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user?.name || user?.username || 'Admin'}</strong>
              <span>Quản trị viên</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}