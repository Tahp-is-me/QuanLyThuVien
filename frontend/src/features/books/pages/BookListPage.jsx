import { useEffect, useState } from 'react'
import Navbar from '../../../components/Navbar'
import BookCard from '../components/BookCard'
import BookFilters from '../components/BookFilters'
import { getBooks, getAuthors, getCategories } from '../api/booksApi'
import { useCart } from '../../../hooks/useCart'

const PAGE_SIZE = 12

export default function BookListPage() {
  const { addToCart } = useCart()

  const [books, setBooks] = useState([])
  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])
  const [authorsMap, setAuthorsMap] = useState({})
  const [categoriesMap, setCategoriesMap] = useState({})

  const [filters, setFilters] = useState({ name: '', author_id: '', category_id: '' })
  const [skip, setSkip] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Load danh sách tác giả + thể loại 1 lần để làm dropdown lọc và tra tên
  useEffect(() => {
    async function loadLookups() {
      try {
        const [authorsRes, categoriesRes] = await Promise.all([getAuthors(), getCategories()])
        const authorList = authorsRes.data.results || authorsRes.data
        const categoryList = categoriesRes.data.results || categoriesRes.data

        setAuthors(authorList)
        setCategories(categoryList)
        setAuthorsMap(Object.fromEntries(authorList.map((a) => [a.id, a.name])))
        setCategoriesMap(Object.fromEntries(categoryList.map((c) => [c.id, c.name])))
      } catch (err) {
        // Không chặn trang nếu lỗi phần lookup, chỉ là sẽ hiện "Tác giả #id"
      }
    }
    loadLookups()
  }, [])

  // Load sách mỗi khi filter hoặc trang thay đổi
  useEffect(() => {
    async function loadBooks() {
      setLoading(true)
      setError('')
      try {
        const params = { skip, limit: PAGE_SIZE }
        if (filters.name) params.name = filters.name
        if (filters.author_id) params.author_id = filters.author_id
        if (filters.category_id) params.category_id = filters.category_id

        const res = await getBooks(params)
        // LimitOffsetPagination trả về { count, next, previous, results }
        setBooks(res.data.results)
        setTotalCount(res.data.count)
      } catch (err) {
        setError('Không tải được danh sách sách. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    loadBooks()
  }, [filters, skip])

  function handleFilterChange(newFilters) {
    setSkip(0) // đổi filter thì quay về trang đầu
    setFilters(newFilters)
  }

  function handleAddToCart(book) {
    addToCart(book, 1)
    setToast(`Đã thêm "${book.name}" vào giỏ`)
    setTimeout(() => setToast(''), 2000)
  }

  const currentPage = Math.floor(skip / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div>
      <Navbar />
      <div className="page-content wide">
        <h1>Danh mục sách</h1>

        <BookFilters authors={authors} categories={categories} onFilterChange={handleFilterChange} />

        {toast && <div className="toast">{toast}</div>}
        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p>Đang tải...</p>
        ) : books.length === 0 ? (
          <p>Không tìm thấy sách phù hợp.</p>
        ) : (
          <div className="book-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                authorsMap={authorsMap}
                categoriesMap={categoriesMap}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        <div className="pagination">
          <button disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}>
            ← Trang trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={skip + PAGE_SIZE >= totalCount}
            onClick={() => setSkip(skip + PAGE_SIZE)}
          >
            Trang sau →
          </button>
        </div>
      </div>
    </div>
  )
}
