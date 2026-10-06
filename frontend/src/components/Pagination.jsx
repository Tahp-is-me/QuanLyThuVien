// Phân trang kiểu skip/limit, dùng lại class .pagination có sẵn trong styles.css
export default function Pagination({ skip, limit, total, onChange }) {
  const currentPage = Math.floor(skip / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="pagination">
      <button disabled={skip === 0} onClick={() => onChange(Math.max(0, skip - limit))}>
        ← Trang trước
      </button>
      <span>
        Trang {currentPage} / {totalPages} ({total} mục)
      </span>
      <button disabled={skip + limit >= total} onClick={() => onChange(skip + limit)}>
        Trang sau →
      </button>
    </div>
  )
}
