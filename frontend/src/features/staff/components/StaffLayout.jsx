import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import '../../../assets/staff.css'

const MENU = [
  { path: 'borrowing', label: 'Phiếu mượn / trả', icon: '🔄' },
  { path: 'books', label: 'Quản lý sách', icon: '📖' },
  { path: 'authors', label: 'Tác giả', icon: '✍️' },
  { path: 'categories', label: 'Thể loại', icon: '🏷️' },
]

// Layout chung: Header (Navbar có sẵn) + Sidebar + Breadcrumbs + nội dung trang con.
// basePath mặc định '/staff'. Khoa có thể dùng lại cho Admin bằng basePath="/admin".
export default function StaffLayout({ basePath = '/staff' }) {
  const location = useLocation()

  const sub = location.pathname.replace(basePath, '').split('/').filter(Boolean)[0] || ''
  const current = MENU.find((m) => m.path === sub)

  return (
    <div>
      <Navbar />
      <div className="staff-shell">
        <aside className="staff-sidebar">
          <p className="staff-sidebar-title">Vận hành thư viện</p>
          <nav>
            {MENU.map((item) => (
              <NavLink
                key={item.path}
                to={item.path ? `${basePath}/${item.path}` : basePath}
                end={item.path === ''}
                className={({ isActive }) => `staff-menu-item${isActive ? ' active' : ''}`}
              >
                <span className="staff-menu-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="staff-main">
          <div className="breadcrumbs">
            <Link to={basePath}>Trang chủ</Link>
            {current && current.path !== '' && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span>{current.label}</span>
              </>
            )}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
