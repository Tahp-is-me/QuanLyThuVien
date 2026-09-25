from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db import transaction as db_transaction
from django.apps import apps

from .models import Transaction, TransactionDetail
from .serializers import (
    TransactionSerializer, 
    CreateTransactionSerializer
)

def get_book_model():
    """Hàm lấy Model Book động. Nếu chưa tạo app/model books thì trả về None để không bị crash server."""
    try:
        return apps.get_model('books', 'Book')
    except Exception:
        return None


class TransactionListCreateView(APIView):
    # 1. POST /api/transactions/ : Reader gửi yêu cầu mượn
    def post(self, request):
        serializer = CreateTransactionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = serializer.validated_data['user_id']
        items = serializer.validated_data['items']

        today = timezone.now().date()

        with db_transaction.atomic():
            trans = Transaction.objects.create(
                user_id=user_id,
                borrow_date=today,             # Truyền ngày hiện tại để tránh NULL
                due_date=today + timedelta(days=14), # Gán sẵn hạn trả 14 ngày để tránh NULL
                status='pending'
            )
            
            for item in items:
                TransactionDetail.objects.create(
                    transaction=trans,
                    book_id=item['book_id'],
                    quantity=item['quantity']
                )

        return Response(TransactionSerializer(trans).data, status=status.HTTP_201_CREATED)

    # 6. GET /api/transactions/ : Staff/Admin xem toàn bộ phiếu mượn
    def get(self, request):
        status_param = request.query_params.get('status', None)
        queryset = Transaction.objects.all().order_by('-id')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        serializer = TransactionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReaderTransactionListView(APIView):
    # 2. GET /api/transactions/me/ : Xem lịch sử mượn cá nhân (FE truyền user_id qua query)
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "Vui lòng truyền user_id"}, status=status.HTTP_400_BAD_REQUEST)

        status_param = request.query_params.get('status', None)
        queryset = Transaction.objects.filter(user_id=user_id).order_by('-id')

        if status_param:
            queryset = queryset.filter(status=status_param)

        serializer = TransactionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReaderTransactionDetailView(APIView):
    # 3. GET /api/transactions/me/{id}/ : Xem chi tiết 1 phiếu mượn
    def get(self, request, pk):
        try:
            trans = Transaction.objects.get(pk=pk)
        except Transaction.DoesNotExist:
            return Response({"error": "Không tìm thấy phiếu mượn"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TransactionSerializer(trans)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReturnRequestView(APIView):
    # 4. PUT /api/transactions/{id}/return-request/ : Reader bấm nút "Trả sách"
    def put(self, request, pk):
        try:
            trans = Transaction.objects.get(pk=pk)
        except Transaction.DoesNotExist:
            return Response({"error": "Không tìm thấy phiếu mượn"}, status=status.HTTP_404_NOT_FOUND)

        if trans.status not in ['borrowed', 'overdue']:
            return Response({"error": "Chỉ phiếu ở trạng thái borrowed hoặc overdue mới được gửi yêu cầu trả"}, status=status.HTTP_400_BAD_REQUEST)

        trans.status = 'return_pending'
        trans.save()
        return Response(TransactionSerializer(trans).data, status=status.HTTP_200_OK)


class CancelTransactionView(APIView):
    # 5. DELETE /api/transactions/{id}/cancel/ : Hủy phiếu mượn khi đang ở trạng thái pending
    def delete(self, request, pk):
        try:
            trans = Transaction.objects.get(pk=pk)
        except Transaction.DoesNotExist:
            return Response({"error": "Không tìm thấy phiếu mượn"}, status=status.HTTP_404_NOT_FOUND)

        if trans.status != 'pending':
            return Response({"error": "Chỉ có thể hủy phiếu mượn khi đang ở trạng thái pending"}, status=status.HTTP_400_BAD_REQUEST)

        trans.delete()
        return Response({"message": "Đã hủy phiếu mượn thành công"}, status=status.HTTP_200_OK)


class ApproveTransactionView(APIView):
    # 7. PUT /api/transactions/{id}/approve/ : Staff/Admin duyệt mượn
    def put(self, request, pk):
        try:
            trans = Transaction.objects.get(pk=pk)
        except Transaction.DoesNotExist:
            return Response({"error": "Không tìm thấy phiếu mượn"}, status=status.HTTP_404_NOT_FOUND)

        if trans.status != 'pending':
            return Response({"error": "Phiếu không ở trạng thái pending"}, status=status.HTTP_400_BAD_REQUEST)

        details = trans.details.all()
        Book = get_book_model()

        # Nếu model Book đã sẵn sàng thì thực hiện kiểm tra và trừ tồn kho
        if Book is not None:
            for item in details:
                try:
                    book = Book.objects.get(pk=item.book_id)
                    if book.quantity < item.quantity:
                        return Response({"error": f"Sách '{book.name}' không đủ số lượng trong kho"}, status=status.HTTP_400_BAD_REQUEST)
                except Book.DoesNotExist:
                    return Response({"error": f"Không tìm thấy sách với ID {item.book_id}"}, status=status.HTTP_404_NOT_FOUND)

            with db_transaction.atomic():
                for item in details:
                    book = Book.objects.get(pk=item.book_id)
                    book.quantity -= item.quantity
                    if book.quantity == 0:
                        book.status = 'out_of_stock'
                    book.save()

                today = timezone.now().date()
                trans.borrow_date = today
                trans.due_date = today + timedelta(days=14)
                trans.status = 'borrowed'
                trans.save()
        else:
            # Nếu chưa có model Book thì cập nhật trạng thái phiếu bình thường
            today = timezone.now().date()
            trans.borrow_date = today
            trans.due_date = today + timedelta(days=14)
            trans.status = 'borrowed'
            trans.save()

        return Response(TransactionSerializer(trans).data, status=status.HTTP_200_OK)


class StaffReturnView(APIView):
    # 8. PUT /api/transactions/{id}/return/ : Staff/Admin duyệt trả sách
    def put(self, request, pk):
        try:
            trans = Transaction.objects.get(pk=pk)
        except Transaction.DoesNotExist:
            return Response({"error": "Không tìm thấy phiếu mượn"}, status=status.HTTP_404_NOT_FOUND)

        if trans.status not in ['borrowed', 'return_pending', 'overdue']:
            return Response({"error": "Phiếu không ở trạng thái hợp lệ để duyệt trả"}, status=status.HTTP_400_BAD_REQUEST)

        details = trans.details.all()
        Book = get_book_model()

        with db_transaction.atomic():
            # Nếu đã có model Book thì hoàn lại số lượng sách vào kho
            if Book is not None:
                for item in details:
                    try:
                        book = Book.objects.get(pk=item.book_id)
                        book.quantity += item.quantity
                        if book.quantity > 0:
                            book.status = 'available'
                        book.save()
                    except Book.DoesNotExist:
                        pass

            trans.return_date = timezone.now().date()
            trans.status = 'returned'
            trans.save()

        return Response(TransactionSerializer(trans).data, status=status.HTTP_200_OK)


class ScanOverdueView(APIView):
    # API phụ: Quét tự động/thủ công các phiếu quá hạn due_date
    def post(self, request):
        today = timezone.now().date()
        updated_count = Transaction.objects.filter(
            status__in=['borrowed', 'return_pending'],
            due_date__lt=today
        ).update(status='overdue')
        
        return Response({
            "message": "Cập nhật phiếu quá hạn thành công",
            "updated_count": updated_count
        }, status=status.HTTP_200_OK)