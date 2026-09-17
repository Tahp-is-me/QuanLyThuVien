from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import User

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'name', 'contact']
        extra_kwargs = {
            'password': {'write_only': True},
            'name': {'required': False, 'allow_null': True, 'allow_blank': True},
            'contact': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def create(self, validated_data):
        hashed_password = make_password(validated_data['password'])
        
        user = User.objects.create(
            username=validated_data['username'],
            password=hashed_password,
            name=validated_data.get('name'),
            contact=validated_data.get('contact'),
            role='reader',
            is_public=1
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Tài khoản hoặc mật khẩu không chính xác.")

        is_correct_password = check_password(password, user.password) or (user.password == password)
        if not is_correct_password:
            raise serializers.ValidationError("Tài khoản hoặc mật khẩu không chính xác.")

        if user.is_public == 0:
            raise serializers.ValidationError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.")

        data['user'] = user
        return data


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'contact', 'role', 'is_public', 'created_at']


class UserUpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'contact']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context['user']
        if not (check_password(value, user.password) or user.password == value):
            raise serializers.ValidationError("Mật khẩu cũ không chính xác.")
        return value