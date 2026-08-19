#cài venv và set up venv
python -m venv .venv

.\.venv\Scripts\Activate.ps1


#cài django
pip install django djangorestframework mysqlclient django-cors-headers


#tạo code ở init 
core_project/__init__.py

import django.db.backends.mysql.base
django.db.backends.mysql.base.DatabaseWrapper.check_database_version_supported = lambda self: None


#tạo code file asgi
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_project.settings')

application = get_asgi_application()


#tạo urls cho core
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('api/users/', include('users.urls')),
    path('api/books/', include('books.urls')),
    path('api/transactions/', include('transactions.urls')),
]


#tạo code urls cho book, users, transactions
from django.urls import path

urlpatterns = [

]

#tạo code cho model trong users
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass


python manage.py makemigrations users
python manage.py makemigrations

python manage.py migrate


python manage.py runserver