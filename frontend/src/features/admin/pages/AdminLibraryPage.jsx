import { Link } from 'react-router-dom'

export default function AdminLibraryPage() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý thư viện</h1>
          <p>Admin có toàn quyền sử dụng các nghiệp vụ quản lý của Staff.</p>
        </div>
      </div>

      <div className="admin-library-grid">
        <div className="admin-card admin-library-box">
          <div className="admin-library-icon">📚</div>
          <h2>Quản lý sách</h2>
          <p>Thêm, sửa, xóa mềm, tìm kiếm và cập nhật nhanh số lượng sách trong kho.</p>
          <Link to="/staff/books" className="admin-btn primary">Mở quản lý sách</Link>
        </div>
        <div className="admin-card admin-library-box">
          <div className="admin-library-icon">🧾</div>
          <h2>Quản lý phiếu mượn</h2>
          <p>Duyệt phiếu mượn, xác nhận trả sách và xử lý các phiếu quá hạn.</p>
          <Link to="/staff/borrowing" className="admin-btn primary">Mở quản lý phiếu</Link>
        </div>
        <div className="admin-card admin-library-box">
          <div className="admin-library-icon">✍️</div>
          <h2>Quản lý tác giả</h2>
          <p>Thêm, sửa, xóa và quản lý thông tin các tác giả trong thư viện.</p>
          <Link to="/staff/authors" className="admin-btn primary">Mở quản lý tác giả</Link>
        </div>
        <div className="admin-card admin-library-box">
          <div className="admin-library-icon">🏷️</div>
          <h2>Quản lý thể loại</h2>
          <p>Thêm, sửa, xóa và quản lý các thể loại sách trong thư viện.</p>
          <Link to="/staff/categories" className="admin-btn primary">Mở quản lý thể loại</Link>
        </div>

      </div>

      <div className="admin-alert info"> Admin có thể truy cập trực tiếp các nghiệp vụ quản lý thư viện từ đây.</div>
    </>
  )
}
