from rest_framework import serializers
from .models import Transaction, TransactionDetail

class TransactionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionDetail
        fields = ['id', 'book_id', 'quantity']

class TransactionSerializer(serializers.ModelSerializer):
    details = TransactionDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'user_id', 'borrow_date', 'due_date', 'return_date', 'status', 'details']

class CreateTransactionDetailInputSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

class CreateTransactionSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    items = CreateTransactionDetailInputSerializer(many=True)