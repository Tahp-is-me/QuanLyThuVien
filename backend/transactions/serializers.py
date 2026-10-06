from django.apps import apps
from rest_framework import serializers
from .models import Transaction, TransactionDetail

class TransactionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionDetail
        fields = ['id', 'book_id', 'quantity']

class TransactionSerializer(serializers.ModelSerializer):
    details = TransactionDetailSerializer(many=True, read_only=True)
    # Tên người mượn để Staff/Admin hiển thị (Staff không có quyền gọi /api/users/)
    user_name = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        user_model = apps.get_model('users', 'User')
        row = user_model.objects.filter(pk=obj.user_id).values('name', 'username').first()
        if not row:
            return None
        return row['name'] or row['username']

    class Meta:
        model = Transaction
        fields = ['id', 'user_id', 'user_name', 'borrow_date', 'due_date', 'return_date', 'status', 'details']

class CreateTransactionDetailInputSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

class CreateTransactionSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    items = CreateTransactionDetailInputSerializer(many=True)