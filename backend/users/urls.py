from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    UserListView, 
    ToggleUserStatusView, 
    ChangeUserRoleView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/toggle-status/', ToggleUserStatusView.as_view(), name='user-toggle-status'),
    path('<int:pk>/change-role/', ChangeUserRoleView.as_view(), name='user-change-role'),
]