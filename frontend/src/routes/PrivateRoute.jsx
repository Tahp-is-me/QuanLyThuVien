import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// allowedRoles: mảng role được phép vào, vd ['reader']
// - Chưa đăng nhập -> đá về /login
// - Đăng nhập rồi nhưng sai role (vd reader cố vào /admin) -> đá về
//   đúng trang chủ của role đó, không cho vào nhầm khu vực
export default function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}
