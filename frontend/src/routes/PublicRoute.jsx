import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PublicRoute({ children }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}
