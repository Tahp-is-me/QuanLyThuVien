import axios from 'axios'
import { getStoredUser } from '../utils/storage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// LƯU Ý QUAN TRỌNG:
// Backend hiện tại KHÔNG dùng JWT thật, dù README có ghi "JWT Authentication".
// Xem file users/permissions.py bên backend thì thấy nó check quyền bằng
// cách đọc header 'X-User-ID' (id của user đang đăng nhập), không verify token gì cả.
// Nên ở FE, mỗi request gửi đi, nếu đã đăng nhập thì tự động gắn kèm
// id của user vào header này để backend biết "ai đang gọi API".
apiClient.interceptors.request.use((config) => {
  const user = getStoredUser()
  if (user?.id) {
    config.headers['X-User-ID'] = user.id
  }
  return config
})

export default apiClient
