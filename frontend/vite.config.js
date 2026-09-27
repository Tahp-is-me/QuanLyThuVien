import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cổng mặc định của Vite là 5173, trùng với CORS_ALLOWED_ORIGINS
// đã cấu hình sẵn bên backend (settings.py), nên không cần đổi gì thêm.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
