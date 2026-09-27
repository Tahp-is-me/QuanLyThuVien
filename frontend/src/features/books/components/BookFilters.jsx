import { useState } from 'react'

export default function BookFilters({ authors, categories, onFilterChange }) {
  const [name, setName] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onFilterChange({ name, author_id: authorId, category_id: categoryId })
  }

  function handleReset() {
    setName('')
    setAuthorId('')
    setCategoryId('')
    onFilterChange({ name: '', author_id: '', category_id: '' })
  }

  return (
    <form className="book-filters" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tìm theo tên sách..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
        <option value="">-- Tất cả tác giả --</option>
        {authors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">-- Tất cả thể loại --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button type="submit" className="btn-primary">
        Tìm kiếm
      </button>
      <button type="button" className="btn-secondary" onClick={handleReset}>
        Xóa lọc
      </button>
    </form>
  )
}
