from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    UserProfileView,
    ChangePasswordView,
    UserListView, 
    ToggleUserStatusView, 
    ChangeUserRoleView,
    UserDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/toggle-status/', ToggleUserStatusView.as_view(), name='user-toggle-status'),
    path('<int:pk>/change-role/', ChangeUserRoleView.as_view(), name='user-change-role'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]