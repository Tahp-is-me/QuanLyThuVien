import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../../../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin({ username, password }) {
    setLoading(true)
    setError('')
    try {
      const user = await login(username, password)
      // Đăng nhập xong thì tự chuyển đúng trang theo role: reader/staff/admin
      navigate(`/${user.role}`)
    } catch (err) {
      // Serializer bên backend raise lỗi kiểu { non_field_errors: [...] }
      const data = err.response?.data
      const message =
        data?.non_field_errors?.[0] ||
        data?.detail ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}
