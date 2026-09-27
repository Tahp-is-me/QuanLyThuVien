import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // useCart cần CartProvider bọc sẵn (đã bọc toàn app trong App.jsx),
  // nhưng chỉ hiển thị số lượng giỏ khi user đang là reader.
  const cart = useCart()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-brand">📚 Thư viện</span>
        {user?.role === 'reader' && (
          <div className="navbar-links">
            <NavLink to="/reader" end>
              Trang chủ
            </NavLink>
            <NavLink to="/reader/cart">Giỏ mượn ({cart.totalItems})</NavLink>
            <NavLink to="/reader/history">Lịch sử mượn</NavLink>
            <NavLink to="/reader/profile">Tài khoản</NavLink>
          </div>
        )}
      </div>

      {user && (
        <div className="navbar-user">
          <span>Xin chào, {user.name || user.username}</span>
          <button onClick={handleLogout}>Đăng xuất</button>
        </div>
      )}
    </nav>
  )
}
