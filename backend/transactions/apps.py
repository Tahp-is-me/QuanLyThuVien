from django.apps import AppConfig

class TransactionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transactions'

    def ready(self):
        # Tự động quét cập nhật overdue khi server khởi động
        try:
            from django.utils import timezone
            from .models import Transaction
            
            today = timezone.now().date()
            Transaction.objects.filter(
                status__in=['borrowed', 'return_pending'],
                due_date__lt=today
            ).update(status='overdue')
        except Exception:
            pass  # Tránh lỗi khi chưa migrate DB