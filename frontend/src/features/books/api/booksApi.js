import apiClient from '../../../services/api'

// GET /api/books/books/?name=...&author_id=...&category_id=...&skip=...&limit=...
// Backend dùng phân trang skip/limit (không phải page number), trả về
// { count, next, previous, results }
export function getBooks(params = {}) {
  return apiClient.get('/api/books/books/', { params })
}

// GET /api/books/books/:id/
export function getBookDetail(id) {
  return apiClient.get(`/api/books/books/${id}/`)
}

// GET /api/books/authors/ - dùng để hiện dropdown lọc + tra tên tác giả theo id
export function getAuthors() {
  return apiClient.get('/api/books/authors/', { params: { limit: 100 } })
}

// GET /api/books/categories/
export function getCategories() {
  return apiClient.get('/api/books/categories/', { params: { limit: 100 } })
}
