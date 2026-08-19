from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegisterSerializer, UserLoginSerializer, UserListSerializer

from .models import User

class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Đăng ký thành công!", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            return Response({
                "message": "Đăng nhập thành công!",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.name,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class UserListView(APIView):
    def get(self, request):
        role = request.query_params.get('role', None)
        is_public = request.query_params.get('is_public', None)

        users = User.objects.all()

        if role:
            users = users.filter(role=role)
        if is_public is not None:
            users = users.filter(is_public=is_public)

        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ToggleUserStatusView(APIView):
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Không tìm thấy người dùng."}, status=status.HTTP_404_NOT_FOUND)

        user.is_public = 0 if user.is_public == 1 else 1
        user.save()

        status_msg = "Khóa tài khoản thành công!" if user.is_public == 0 else "Mở khóa tài khoản thành công!"
        return Response({
            "message": status_msg,
            "user": UserListSerializer(user).data
        }, status=status.HTTP_200_OK)


class ChangeUserRoleView(APIView):
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Không tìm thấy người dùng."}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role not in ['reader', 'staff', 'admin']:
            return Response({"error": "Role không hợp lệ. Chỉ chấp nhận: reader, staff, admin."}, status=status.HTTP_400_BAD_REQUEST)

        user.role = new_role
        user.save()

        return Response({
            "message": f"Cập nhật quyền thành công! Vai trò mới: {new_role}",
            "user": UserListSerializer(user).data
        }, status=status.HTTP_200_OK)