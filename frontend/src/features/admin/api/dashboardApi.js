import apiClient from '../../../services/api'
import { getBooks } from '../../books/api/booksApi'
import { getUsers } from './adminApi'
import { getAllTransactions } from './adminTransactionsApi'

// README có yêu cầu /api/dashboard/stats/, nhưng backend hiện tại chưa có route này.
// Vì vậy FE dùng các API đã tồn tại để tính số liệu Dashboard, không làm hỏng project.
export async function getDashboardStats() {
  const [booksRes, readersRes, transactionsRes] = await Promise.all([
    getBooks({ skip: 0, limit: 1 }),
    getUsers({ role: 'reader' }),
    getAllTransactions(),
  ])

  const booksData = booksRes.data || {}
  const booksCount = Number(booksData.count ?? (Array.isArray(booksData) ? booksData.length : 0))
  const readers = Array.isArray(readersRes.data) ? readersRes.data : []
  const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : []

  return {
    totalBooks: booksCount,
    totalReaders: readers.length,
    totalTransactions: transactions.length,
    totalOverdue: transactions.filter((item) => item.status === 'overdue').length,
  }
}
