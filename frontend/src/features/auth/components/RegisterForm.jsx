import { useState } from 'react'

export default function RegisterForm({ onSubmit, loading, errors }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    contact: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Tên đăng nhập
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        {errors?.username && <p className="form-error">{errors.username[0]}</p>}
      </label>

      <label>
        Mật khẩu
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        {errors?.password && <p className="form-error">{errors.password[0]}</p>}
      </label>

      <label>
        Họ tên
        <input type="text" name="name" value={form.name} onChange={handleChange} />
      </label>

      <label>
        Số điện thoại
        <input type="text" name="contact" value={form.contact} onChange={handleChange} />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
    </form>
  )
}
