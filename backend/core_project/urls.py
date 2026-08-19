from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('api/users/', include('users.urls')),
    path('api/books/', include('books.urls')),
    path('api/transactions/', include('transactions.urls')),
]