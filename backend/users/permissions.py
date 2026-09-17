from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'custom_user') and request.custom_user.role == 'admin'

class IsStaffRole(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'custom_user') and request.custom_user.role in ['admin', 'staff']