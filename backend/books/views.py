from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.pagination import LimitOffsetPagination

from .models import Book, Author, Category
from .serializers import BookSerializer, AuthorSerializer, CategorySerializer
from users.models import User
from users.permissions import IsStaffRole

# 1. Phân trang bằng skip & limit
class SkipLimitPagination(LimitOffsetPagination):
    default_limit = 10
    limit_query_param = 'limit'
    offset_query_param = 'skip'
    max_limit = 100

# 2. Custom Permission (Public xem, Staff/Admin sửa)
class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return IsStaffRole().has_permission(request, view)

# 3. ViewSet Base nhận diện Role
class BaseLibraryViewSet(viewsets.ModelViewSet):
    pagination_class = SkipLimitPagination
    permission_classes = [IsStaffOrReadOnly]

    def _get_user_role(self, request):
        user_id = request.headers.get('X-User-ID') or request.query_params.get('user_id')
        if user_id:
            try:
                user = User.objects.get(pk=user_id)
                if user.is_public == 1:
                    return user.role
            except (User.DoesNotExist, ValueError):
                pass
        return 'public'

# 4. Author ViewSet (Tác giả)
class AuthorViewSet(BaseLibraryViewSet):
    serializer_class = AuthorSerializer

    def get_queryset(self):
        queryset = Author.objects.all().order_by('-id')
        role = self._get_user_role(self.request)

        if role in ['admin', 'staff']:
            # Lọc theo is_public nếu có truyền param (?is_public=true/false)
            is_public_param = self.request.query_params.get('is_public')
            if is_public_param is not None:
                is_public_bool = is_public_param.lower() in ['true', '1']
                queryset = queryset.filter(is_public=is_public_bool)
        else:
            # Quyền Public/Reader: Chỉ lấy is_public = True
            queryset = queryset.filter(is_public=True)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        role = self._get_user_role(request)

        if role not in ['admin', 'staff'] and not instance.is_public:
            return Response({"detail": "Không tìm thấy tác giả."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        author = self.get_object()

        # Check xem còn cuốn sách nào có tác giả này không
        if Book.objects.filter(author=author).exists():
            return Response(
                {"error": "Không thể xóa vì tác giả này đang có sách trong hệ thống."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Đổi is_public = False (Soft Delete)
        author.is_public = False
        author.save()
        return Response({"message": "Đã vô hiệu hóa (xóa mềm) tác giả thành công."}, status=status.HTTP_200_OK)

# 5. Category ViewSet (Thể loại)
class CategoryViewSet(BaseLibraryViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        queryset = Category.objects.all().order_by('-id')
        role = self._get_user_role(self.request)

        if role in ['admin', 'staff']:
            is_public_param = self.request.query_params.get('is_public')
            if is_public_param is not None:
                is_public_bool = is_public_param.lower() in ['true', '1']
                queryset = queryset.filter(is_public=is_public_bool)
        else:
            queryset = queryset.filter(is_public=True)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        role = self._get_user_role(request)

        if role not in ['admin', 'staff'] and not instance.is_public:
            return Response({"detail": "Không tìm thấy thể loại."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        # Check xem còn cuốn sách nào thuộc thể loại này không
        if Book.objects.filter(category=category).exists():
            return Response(
                {"error": "Không thể xóa vì thể loại này đang có sách trong hệ thống."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category.is_public = False
        category.save()
        return Response({"message": "Đã vô hiệu hóa (xóa mềm) thể loại thành công."}, status=status.HTTP_200_OK)

# 6. Book ViewSet (Quản lý Sách)
class BookViewSet(BaseLibraryViewSet):
    serializer_class = BookSerializer

    def get_queryset(self):
        # Tối ưu ORM tránh lỗi N+1 Query
        queryset = Book.objects.all().select_related('author', 'category').order_by('-id')
        role = self._get_user_role(self.request)

        # Lọc tìm kiếm theo tên, tác giả, thể loại
        name = self.request.query_params.get('name')
        author_id = self.request.query_params.get('author_id')
        category_id = self.request.query_params.get('category_id')

        if name:
            queryset = queryset.filter(name__icontains=name)
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if role in ['admin', 'staff']:
            is_public_param = self.request.query_params.get('is_public')
            if is_public_param is not None:
                is_public_bool = is_public_param.lower() in ['true', '1']
                queryset = queryset.filter(is_public=is_public_bool)
        else:
            # Public/Reader: Chỉ thấy is_public = True và status = 'available'
            queryset = queryset.filter(is_public=True, status='available')

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        role = self._get_user_role(request)

        if role not in ['admin', 'staff']:
            if not instance.is_public or instance.status != 'available':
                return Response({"detail": "Không tìm thấy sách hoặc sách hiện không khả dụng."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        book = self.get_object()

        # 1. Chỉ được xóa khi sách có status là 'available'
        if book.status != 'available':
            return Response(
                {"error": "Chỉ được xóa sách khi đang ở trạng thái 'available'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Kiểm tra sách đã từng nằm trong giao dịch mượn/trả chưa
        has_transactions = False
        if hasattr(book, 'transactiondetails_set') and book.transactiondetails_set.exists():
            has_transactions = True
        elif hasattr(book, 'transaction_details') and book.transaction_details.exists():
            has_transactions = True

        if has_transactions:
            return Response(
                {"error": "Sách này đã có lịch sử mượn/trả, không thể xóa."},
                status=status.HTTP_400_BAD_REQUEST
            )

        book.is_public = False
        book.save()
        return Response({"message": "Đã vô hiệu hóa (xóa mềm) sách thành công."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], permission_classes=[IsStaffRole])
    def quick_update_quantity(self, request, pk=None):
        """
        API Cập nhật nhanh số lượng sách (Quick update quantity)
        """
        book = self.get_object()
        new_quantity = request.data.get('quantity')

        if new_quantity is None:
            return Response({"error": "Vui lòng cung cấp giá trị quantity."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_quantity = int(new_quantity)
            if new_quantity < 0:
                raise ValueError
        except ValueError:
            return Response({"error": "Số lượng (quantity) phải là số nguyên không âm."}, status=status.HTTP_400_BAD_REQUEST)

        book.quantity = new_quantity
        book.status = 'out_of_stock' if book.quantity == 0 else 'available'
        book.save()

        return Response({
            "message": "Cập nhật số lượng sách nhanh thành công.",
            "data": BookSerializer(book).data
        }, status=status.HTTP_200_OK)