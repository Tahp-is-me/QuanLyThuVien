# Hướng dẫn chạy phần Frontend (Reader)

## 1. Cách thêm vào project

Copy toàn bộ nội dung thư mục `frontend/` này vào đúng vị trí `frontend/` trong
repo của nhóm (ngang hàng với `backend/`). Nếu nhóm đã có sẵn `frontend/` với
file khác thì merge lại, đừng ghi đè lung tung.

## 2. Cài đặt

```bash
cd frontend
npm install
```

## 3. Chạy backend trước

Đảm bảo Django đang chạy ở cổng 8000 (mặc định):

```bash
cd backend
python manage.py runserver
```

## 4. Chạy frontend

```bash
cd frontend
npm run dev
```

Mở trình duyệt vào `http://localhost:5173`.

## 5. Test thử luồng

Dùng 3 tài khoản có sẵn trong DB (theo ảnh phân công):

| username  | password  | role   |
|-----------|-----------|--------|
| admin001  | admin123  | admin  |
| staff001  | admin123  | staff  |
| reader001 | admin123  | reader |

- Đăng nhập bằng `reader001` → phải vào thẳng `/reader`.
- Đăng nhập bằng `staff001` → vào `/staff`.
- Đăng nhập bằng `admin001` → vào `/admin`.
- Gõ tay URL `/admin` khi đang login bằng `reader001` → phải bị đá về `/reader`
  (test PrivateRoute có chặn đúng theo role không).
- Vào `/register`, tạo tài khoản reader mới → quay lại `/login` login thử bằng
  tài khoản vừa tạo.

## 6. Vì sao không thấy JWT ở đâu cả?

README của nhóm ghi "JWT Authentication", nhưng đọc code thật ở
`backend/users/permissions.py` thì thấy nó chỉ check header `X-User-ID`
(id của user đang đăng nhập) — không có verify token/chữ ký gì cả.

Nên ở đây mình làm theo ĐÚNG những gì backend đang thật sự chạy:
- Login xong, FE lưu nguyên object `user` (gồm `id`) vào `localStorage`.
- Mỗi request gọi API, axios tự động gắn `id` đó vào header `X-User-ID`
  (xem `src/services/api.js`).

Cách này **không an toàn** cho production thật (ai cũng sửa được header),
nhưng đúng với những gì backend nhóm đang implement. Nếu sau này Khang đổi
qua JWT thật thì chỉ cần sửa `src/services/api.js` (thêm interceptor gắn
`Authorization: Bearer <token>`), không phải sửa gì ở các trang khác.

## 7. Lưu ý về backend (đã báo Khang/Phát trước đó)

- App `books` bên backend hiện thiếu thư mục `migrations/`. Nếu gọi API
  `/api/books/books/` mà lỗi 500 do "no such table", nghĩa là DB đã import
  từ file `.sql` nên có bảng sẵn rồi thì không sao — chỉ lưu ý nếu ai đó
  chạy `migrate` từ đầu (không import sql) thì bảng book/author/category
  sẽ không được tạo.

## 8. Các trang Reader đã làm xong (bản cập nhật mới)

- **Danh mục sách** (`/reader/books`): tìm theo tên, lọc theo tác giả/thể
  loại, phân trang theo skip/limit đúng kiểu backend (không phải page number).
- **Chi tiết sách** (`/reader/books/:id`)
- **Giỏ mượn** (`/reader/cart`): lưu tạm trong `localStorage` theo từng user,
  chỉnh số lượng, xóa, gửi yêu cầu mượn (gọi `POST /api/transactions/`).
- **Lịch sử mượn** (`/reader/history`): lọc theo trạng thái, hủy phiếu
  (khi đang `pending`), gửi yêu cầu trả sách (khi `borrowed`/`overdue`).

### Vài điểm kỹ thuật cần biết khi đọc code:

1. **API sách trả `author`/`category` là ID (số), không phải tên.**
   Nên các trang phải tự gọi thêm API `authors`/`categories` rồi map
   ID → tên (xem biến `authorsMap`, `categoriesMap` trong code).

2. **`POST /api/transactions/` vẫn bắt buộc phải có `user_id` trong body**,
   dù ta đã tự động gắn header `X-User-ID`. Đây là cách backend hiện đang
   viết (không tự suy ra user từ header cho riêng API này), nên `CartPage`
   phải chủ động thêm `user_id: user.id` vào payload.

3. **Giới hạn khi sách hết hàng**: nếu 1 cuốn sách bị `quantity = 0`
   (thành `out_of_stock`), API `retrieve` (xem chi tiết) sẽ trả 404 cho
   Reader. Vì lịch sử mượn chỉ lưu `book_id`, nên nếu sách đó sau này hết
   hàng, trang Lịch sử mượn sẽ hiện `"Sách #12 (không khả dụng)"` thay vì
   tên thật — đây là hạn chế từ thiết kế backend, không phải bug ở FE.

4. **Giỏ mượn không đồng bộ với server** — chỉ là nơi tạm gom sách trước
   khi bấm "Gửi yêu cầu mượn". Sau khi gửi thành công, giỏ sẽ tự xóa sạch.

Việc còn lại theo phân công: chờ Hiếu/Khoa hoàn thiện UI Staff/Admin
(hiện đang là placeholder), và có thể bổ sung thêm trang cập nhật hồ sơ
cá nhân (`UserProfileView` — API đã có sẵn, chưa làm UI).
