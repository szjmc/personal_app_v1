from django.urls import path
from . import views

urlpatterns = [
    # 认证相关
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.current_user, name='current-user'),
    
    # 用户信息
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('details/', views.UserDetailView.as_view(), name='user-details'),
    path('change-password/', views.change_password, name='change-password'),
]