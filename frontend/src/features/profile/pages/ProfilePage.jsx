import { useEffect, useState } from 'react'
import Navbar from '../../../components/Navbar'
import { useAuth } from '../../../hooks/useAuth'
import { getProfile, updateProfile, changePassword } from '../api/profileApi'
import { formatDate } from '../../../utils/format'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', contact: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getProfile()
        setProfile(res.data)
        setForm({ name: res.data.name || '', contact: res.data.contact || '' })
      } catch (err) {
        setSaveError('Không tải được thông tin tài khoản.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    setSaveError('')
    try {
      const res = await updateProfile(form)
      setProfile(res.data.user)
      // Cập nhật luôn tên hiển thị trên Navbar mà không cần đăng nhập lại
      updateUser({ name: res.data.user.name })
      setSaveMsg(res.data.message || 'Cập nhật thành công!')
    } catch (err) {
      const data = err.response?.data
      setSaveError(data?.name?.[0] || data?.contact?.[0] || 'Cập nhật thất bại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwMsg('')
    setPwError('')

    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('Mật khẩu mới nhập lại không khớp.')
      return
    }

    setPwSaving(true)
    try {
      const res = await changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      setPwMsg(res.data.message || 'Đổi mật khẩu thành công!')
      setPwForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      const data = err.response?.data
      setPwError(
        data?.old_password?.[0] || data?.new_password?.[0] || 'Đổi mật khẩu thất bại.',
      )
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-content">
        <h1>Tài khoản của tôi</h1>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <div className="profile-section">
              <h2>Thông tin cá nhân</h2>
              <p className="profile-readonly">
                Tên đăng nhập: <strong>{profile?.username}</strong>
              </p>
              <p className="profile-readonly">
                Vai trò: <strong>{user?.role}</strong>
              </p>
              <p className="profile-readonly">
                Ngày tạo tài khoản: {formatDate(profile?.created_at)}
              </p>

              <form className="auth-form" onSubmit={handleSaveProfile}>
                <label>
                  Họ tên
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    type="text"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </label>

                {saveMsg && <p className="form-success">{saveMsg}</p>}
                {saveError && <p className="form-error">{saveError}</p>}

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>

            <div className="profile-section">
              <h2>Đổi mật khẩu</h2>
              <form className="auth-form" onSubmit={handleChangePassword}>
                <label>
                  Mật khẩu hiện tại
                  <input
                    type="password"
                    value={pwForm.old_password}
                    onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Mật khẩu mới
                  <input
                    type="password"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Nhập lại mật khẩu mới
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    required
                  />
                </label>

                {pwMsg && <p className="form-success">{pwMsg}</p>}
                {pwError && <p className="form-error">{pwError}</p>}

                <button type="submit" className="btn-primary" disabled={pwSaving}>
                  {pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
