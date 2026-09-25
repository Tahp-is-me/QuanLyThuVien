from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('borrowed', 'Borrowed'),
        ('return_pending', 'Return Pending'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='transactions')
    borrow_date = models.DateField(null=True, blank=True)  # <-- Bỏ auto_now_add=True, thêm null=True, blank=True
    due_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        db_table = 'transaction'

class TransactionDetail(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, db_column='transaction_id', related_name='details')
    book_id = models.IntegerField()
    quantity = models.IntegerField(default=1)

    class Meta:
        db_table = 'transaction_details'