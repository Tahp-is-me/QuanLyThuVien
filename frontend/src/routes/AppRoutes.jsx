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
import AdminLayout from '../features/admin/components/AdminLayout'
import AdminHomePage from '../features/admin/pages/AdminHomePage'
import AdminLibraryPage from '../features/admin/pages/AdminLibraryPage'
import UserManagementPage from '../features/admin/pages/UserManagementPage'

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

      {/* Hiếu: Staff sửa thông tin tài khoản - dùng lại ProfilePage của Phong */}
      <Route
        path="/staff/profile"
        element={
          <PrivateRoute allowedRoles={['staff']}>
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
        <Route path="borrowing" element={<StaffTransactionsPage />} />
        <Route path="authors" element={<StaffAuthorsPage />} />
        <Route path="categories" element={<StaffCategoriesPage />} />
      </Route>  

      {/* Khu vực Admin - Khoa */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminHomePage />} />

        <Route
          path="users"
          element={<UserManagementPage />}
        />

        <Route
          path="library"
          element={<AdminLibraryPage />}
        />
      </Route>
      {/* Hiếu: Admin sửa thông tin tài khoản - dùng lại ProfilePage của Phong */}
      <Route
        path="/admin/profile"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <ProfilePage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
