import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import { getBookDetail, getAuthors, getCategories } from '../api/booksApi'
import { useCart } from '../../../hooks/useCart'

export default function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [book, setBook] = useState(null)
  const [authorName, setAuthorName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [bookRes, authorsRes, categoriesRes] = await Promise.all([
          getBookDetail(id),
          getAuthors(),
          getCategories(),
        ])
        const bookData = bookRes.data
        setBook(bookData)

        const authorList = authorsRes.data.results || authorsRes.data
        const categoryList = categoriesRes.data.results || categoriesRes.data
        const foundAuthor = authorList.find((a) => a.id === bookData.author)
        const foundCategory = categoryList.find((c) => c.id === bookData.category)
        setAuthorName(foundAuthor?.name || `Tác giả #${bookData.author}`)
        setCategoryName(foundCategory?.name || `Thể loại #${bookData.category}`)
      } catch (err) {
        // Backend trả 404 nếu sách không public hoặc hết hàng (status != available)
        setError('Không tìm thấy sách hoặc sách hiện không khả dụng.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  function handleAddToCart() {
    addToCart(book, quantity)
    setToast(`Đã thêm ${quantity} cuốn "${book.name}" vào giỏ`)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div>
      <Navbar />
      <div className="page-content">
        <Link to="/reader">← Quay lại trang chủ</Link>

        {loading && <p>Đang tải...</p>}
        {error && <p className="form-error">{error}</p>}

        {book && !loading && (
          <div className="book-detail">
            <div className="book-detail-image">
              {book.image_url ? (
                <img src={book.image_url} alt={book.name} />
              ) : (
                <div className="book-card-image-placeholder large">📖</div>
              )}
            </div>

            <div className="book-detail-info">
              <h1>{book.name}</h1>
              <p>
                <strong>Tác giả:</strong> {authorName}
              </p>
              <p>
                <strong>Thể loại:</strong> {categoryName}
              </p>
              <p>
                <strong>Ngày phát hành:</strong> {book.public_date || '—'}
              </p>
              <p>
                <strong>Số lượng còn lại:</strong> {book.quantity}
              </p>

              {book.quantity > 0 ? (
                <div className="quantity-picker">
                  <label>
                    Số lượng mượn:
                    <input
                      type="number"
                      min={1}
                      max={book.quantity}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(1, Math.min(book.quantity, Number(e.target.value) || 1)),
                        )
                      }
                    />
                  </label>
                  <button className="btn-primary" onClick={handleAddToCart}>
                    Thêm vào giỏ
                  </button>
                </div>
              ) : (
                <p className="form-error">Sách hiện đã hết, không thể mượn.</p>
              )}

              {toast && <div className="toast">{toast}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
