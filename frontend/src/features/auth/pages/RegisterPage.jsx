import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RegisterForm from '../components/RegisterForm'
import { useAuth } from '../../../hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  async function handleRegister(form) {
    setLoading(true)
    setErrors(null)
    setSuccessMsg('')
    try {
      const data = await register(form)
      setSuccessMsg(data.message || 'Đăng ký thành công!')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      // Lỗi validate của DRF trả về dạng { field_name: ["message"] }
      setErrors(err.response?.data || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng ký tài khoản Độc giả</h1>
        <RegisterForm onSubmit={handleRegister} loading={loading} errors={errors} />
        {successMsg && <p className="form-success">{successMsg}</p>}
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
