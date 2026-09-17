from rest_framework.permissions import BasePermission
from .models import User

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        # Lấy User ID từ Header 'X-User-ID' hoặc Query Param 'user_id' do FE gửi lên
        user_id = request.headers.get('X-User-ID') or request.query_params.get('user_id')
        
        if not user_id:
            return False

        try:
            user = User.objects.get(pk=user_id)
            # Chỉ cho phép nếu tài khoản tồn tại, có role Admin và không bị khóa
            return user.role == 'admin' and user.is_public == 1
        except (User.DoesNotExist, ValueError):
            return False


class IsStaffRole(BasePermission):
    def has_permission(self, request, view):
        user_id = request.headers.get('X-User-ID') or request.query_params.get('user_id')
        
        if not user_id:
            return False

        try:
            user = User.objects.get(pk=user_id)
            # Cho phép cả Admin và Staff truy cập
            return user.role in ['admin', 'staff'] and user.is_public == 1
        except (User.DoesNotExist, ValueError):
            return False


class IsAuthenticatedCustom(BasePermission):
    def has_permission(self, request, view):
        user_id = request.headers.get('X-User-ID') or request.query_params.get('user_id')
        if not user_id:
            return False
        try:
            user = User.objects.get(pk=user_id)
            if user.is_public == 0:
                return False
            # Gán user vào request để View dùng tiện hơn
            request.custom_user = user
            return True
        except (User.DoesNotExist, ValueError):
            return False