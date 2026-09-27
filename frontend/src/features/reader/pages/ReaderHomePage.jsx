import { Link } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import { useAuth } from '../../../hooks/useAuth'

export default function ReaderHomePage() {
  const { user } = useAuth()

  return (
    <div>
      <Navbar />
      <div className="page-content">
        <h1>Trang chủ Độc giả</h1>
        <p>
          Xin chào <strong>{user?.name || user?.username}</strong>, bạn đã đăng nhập
          thành công với vai trò <strong>Reader</strong>.
        </p>

        <div className="quick-links">
          <Link to="/reader/books" className="quick-link-card">
            📖 Danh mục sách
          </Link>
          <Link to="/reader/cart" className="quick-link-card">
            🛒 Giỏ mượn
          </Link>
          <Link to="/reader/history" className="quick-link-card">
            🕑 Lịch sử mượn
          </Link>
        </div>
      </div>
    </div>
  )
}
