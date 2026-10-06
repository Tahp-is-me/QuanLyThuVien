import apiClient from '../../../services/api'

// Header X-User-ID đã được services/api.js tự gắn -> Staff/Admin sẽ thấy cả
// bản ghi is_public = false và được phép POST/PUT/DELETE.
// Phân trang theo skip/limit, response: { count, next, previous, results }

export const MAX_LIMIT = 100 // max_limit của SkipLimitPagination bên backend

// ----- Tác giả -----
export const listAuthors = (params) => apiClient.get('/api/books/authors/', { params })
export const createAuthor = (payload) => apiClient.post('/api/books/authors/', payload)
export const updateAuthor = (id, payload) => apiClient.put(`/api/books/authors/${id}/`, payload)
export const deleteAuthor = (id) => apiClient.delete(`/api/books/authors/${id}/`)

// ----- Thể loại -----
export const listCategories = (params) => apiClient.get('/api/books/categories/', { params })
export const createCategory = (payload) => apiClient.post('/api/books/categories/', payload)
export const updateCategory = (id, payload) => apiClient.put(`/api/books/categories/${id}/`, payload)
export const deleteCategory = (id) => apiClient.delete(`/api/books/categories/${id}/`)

// ----- Sách -----
// params: { name, author_id, category_id, is_public, skip, limit }
export const listBooks = (params) => apiClient.get('/api/books/books/', { params })
export const createBook = (payload) => apiClient.post('/api/books/books/', payload)
export const updateBook = (id, payload) => apiClient.put(`/api/books/books/${id}/`, payload)
export const deleteBook = (id) => apiClient.delete(`/api/books/books/${id}/`)

// PUT /api/books/books/:id/quick_update_quantity/  body: { quantity }
export const quickUpdateBookQuantity = (id, quantity) =>
  apiClient.put(`/api/books/books/${id}/quick_update_quantity/`, { quantity })

// Lấy toàn bộ bản ghi bằng cách lặp qua các trang - dùng cho dropdown / tra tên.
export async function fetchAll(listFn, params = {}) {
  const all = []
  let skip = 0
  for (;;) {
    const res = await listFn({ ...params, skip, limit: MAX_LIMIT })
    const results = res.data.results || res.data
    all.push(...results)
    if (!res.data.next || results.length === 0) break
    skip += MAX_LIMIT
  }
  return all
}
