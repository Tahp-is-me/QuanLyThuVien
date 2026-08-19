from rest_framework import serializers
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
        user = User.objects.create(
            username=validated_data['username'],
            password=validated_data['password'],
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

        if user.password != password:
            raise serializers.ValidationError("Tài khoản hoặc mật khẩu không chính xác.")

        data['user'] = user
        return data



class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'contact', 'role', 'is_public', 'created_at']