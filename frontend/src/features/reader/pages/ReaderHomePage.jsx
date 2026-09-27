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
        <p>
          Đây là trang khởi điểm — các trang tiếp theo (Catalog sách, Chi tiết sách, Giỏ
          mượn, Lịch sử mượn) sẽ được nối tiếp vào khu vực này.
        </p>
      </div>
    </div>
  )
}
