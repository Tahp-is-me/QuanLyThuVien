from django.urls import path
from .views import (
    TransactionListCreateView,
    ReaderTransactionListView,
    ReaderTransactionDetailView,
    ReturnRequestView,
    CancelTransactionView,
    ApproveTransactionView,
    StaffReturnView,
    ScanOverdueView
)

urlpatterns = [
    # GET  /api/transactions/ : Staff xem toàn bộ danh sách
    # POST /api/transactions/ : Reader gửi yêu cầu mượn
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),
    
    # Reader
    path('me/', ReaderTransactionListView.as_view(), name='reader-transactions'),
    path('me/<int:pk>/', ReaderTransactionDetailView.as_view(), name='reader-transaction-detail'),
    path('<int:pk>/return-request/', ReturnRequestView.as_view(), name='return-request'),
    path('<int:pk>/cancel/', CancelTransactionView.as_view(), name='cancel-transaction'),
    
    # Staff / Admin
    path('<int:pk>/approve/', ApproveTransactionView.as_view(), name='approve-transaction'),
    path('<int:pk>/return/', StaffReturnView.as_view(), name='staff-return-transaction'),
    
    # Scan Overdue
    path('scan-overdue/', ScanOverdueView.as_view(), name='scan-overdue'),
]