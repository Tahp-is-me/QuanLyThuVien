import { createContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const CartContext = createContext(null)

function cartKey(userId) {
  return `cart_${userId}`
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  // Mỗi user có giỏ riêng, lưu trong localStorage theo key riêng của user đó
  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    try {
      const raw = localStorage.getItem(cartKey(user.id))
      setItems(raw ? JSON.parse(raw) : [])
    } catch (err) {
      setItems([])
    }
  }, [user])

  function persist(newItems) {
    setItems(newItems)
    if (user) {
      localStorage.setItem(cartKey(user.id), JSON.stringify(newItems))
    }
  }

  // book: { id, name, quantity(tồn kho) }
  function addToCart(book, quantity = 1) {
    const existing = items.find((it) => it.book_id === book.id)
    let newItems

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, book.quantity)
      newItems = items.map((it) =>
        it.book_id === book.id ? { ...it, quantity: newQty } : it,
      )
    } else {
      newItems = [
        ...items,
        {
          book_id: book.id,
          name: book.name,
          maxQuantity: book.quantity,
          quantity: Math.min(quantity, book.quantity),
        },
      ]
    }
    persist(newItems)
  }

  function updateQuantity(bookId, quantity) {
    const newItems = items.map((it) =>
      it.book_id === bookId
        ? { ...it, quantity: Math.max(1, Math.min(quantity, it.maxQuantity)) }
        : it,
    )
    persist(newItems)
  }

  function removeFromCart(bookId) {
    persist(items.filter((it) => it.book_id !== bookId))
  }

  function clearCart() {
    persist([])
  }

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
