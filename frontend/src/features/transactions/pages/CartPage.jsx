import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import { useCart } from '../../../hooks/useCart'
import { useAuth } from '../../../hooks/useAuth'
import { createTransaction } from '../api/transactionsApi'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (items.length === 0) return
    setLoading(true)
    setError('')
    try {
      // Backend vẫn cần user_id trong body dù đã có header X-User-ID
      await createTransaction({
        user_id: user.id,
        items: items.map((it) => ({ book_id: it.book_id, quantity: it.quantity })),
      })
      clearCart()
      navigate('/reader/history')
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || data?.detail || 'Gửi yêu cầu mượn thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page-content">
        <h1>Giỏ mượn sách</h1>

        {items.length === 0 ? (
          <p>
            Giỏ mượn đang trống. <Link to="/reader">Xem danh mục sách</Link>
          </p>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Tên sách</th>
                  <th>Số lượng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.book_id}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.book_id, Number(e.target.value) || 1)
                        }
                      />
                      <span className="cart-max-hint"> / tối đa {item.maxQuantity}</span>
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => removeFromCart(item.book_id)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {error && <p className="form-error">{error}</p>}

            <button className="btn-primary" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
