import { Link } from 'react-router-dom'

// authorsMap, categoriesMap: { [id]: name } - vì API books trả author/category
// dưới dạng ID (số), không phải tên, nên cần map ngược lại để hiện tên.
export default function BookCard({ book, authorsMap, categoriesMap, onAddToCart }) {
  const authorName = authorsMap[book.author] || `Tác giả #${book.author}`
  const categoryName = categoriesMap[book.category] || `Thể loại #${book.category}`

  return (
    <div className="book-card">
      <div className="book-card-image">
        {book.image_url ? (
          <img src={book.image_url} alt={book.name} />
        ) : (
          <div className="book-card-image-placeholder">📖</div>
        )}
      </div>
      <div className="book-card-body">
        <Link to={`/reader/books/${book.id}`} className="book-card-title">
          {book.name}
        </Link>
        <p className="book-card-meta">Tác giả: {authorName}</p>
        <p className="book-card-meta">Thể loại: {categoryName}</p>
        <p className="book-card-meta">Còn lại: {book.quantity}</p>
        <button
          className="btn-secondary"
          disabled={book.quantity < 1}
          onClick={() => onAddToCart(book)}
        >
          {book.quantity < 1 ? 'Hết sách' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  )
}
