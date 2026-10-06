import { Routes, Route, Navigate } from 'react-router-dom'
import PublicRoute from './PublicRoute'
import PrivateRoute from './PrivateRoute'

import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import StaffLayout from '../features/staff/components/StaffLayout'
import StaffHomePage from '../features/staff/pages/StaffHomePage'
import StaffBooksPage from '../features/staff/pages/StaffBooksPage'
import StaffAuthorsPage from '../features/staff/pages/StaffAuthorsPage'
import StaffCategoriesPage from '../features/staff/pages/StaffCategoriesPage'
import StaffTransactionsPage from '../features/staff/pages/StaffTransactionsPage'
import AdminHomePage from '../features/admin/pages/AdminHomePage'

import BookListPage from '../features/books/pages/BookListPage'
import BookDetailPage from '../features/books/pages/BookDetailPage'
import CartPage from '../features/transactions/pages/CartPage'
import TransactionHistoryPage from '../features/transactions/pages/TransactionHistoryPage'
import ProfilePage from '../features/profile/pages/ProfilePage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Khu vực Reader - trang chủ CHÍNH LÀ danh mục sách (kiểu Shopee) */}
      <Route
        path="/reader"
        element={
          <PrivateRoute allowedRoles={['reader']}>
            <BookListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reader/books/:id"
        element={
          <PrivateRoute allowedRoles={['reader']}>
            <BookDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reader/cart"
        element={
          <PrivateRoute allowedRoles={['reader']}>
            <CartPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reader/history"
        element={
          <PrivateRoute allowedRoles={['reader']}>
            <TransactionHistoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reader/profile"
        element={
          <PrivateRoute allowedRoles={['reader']}>
            <ProfilePage />
          </PrivateRoute>
        }
      />

      {/* Khu vực Staff (Hiếu) - Admin cũng vào được, dùng chung layout + các trang */}
      <Route
        path="/staff"
        element={
          <PrivateRoute allowedRoles={['staff', 'admin']}>
            <StaffLayout basePath="/staff" />
          </PrivateRoute>
        }
      >
        <Route index element={<StaffHomePage />} />
        <Route path="books" element={<StaffBooksPage />} />
        <Route path="authors" element={<StaffAuthorsPage />} />
        <Route path="categories" element={<StaffCategoriesPage />} />
        <Route path="transactions" element={<StaffTransactionsPage />} />
      </Route>

      {/* Placeholder cho Khoa */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminHomePage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
