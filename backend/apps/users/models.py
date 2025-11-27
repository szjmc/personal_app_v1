from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """自定义用户模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    timezone = models.CharField(max_length=50, default='Asia/Shanghai')
    theme = models.CharField(
        max_length=20, 
        choices=[
            ('light', '浅色'),
            ('dark', '深色'),
            ('auto', '自动'),
        ],
        default='auto'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """用户配置"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    notification_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='zh-hans')
    working_hours_start = models.TimeField(default='09:00')
    working_hours_end = models.TimeField(default='18:00')
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = '用户配置'
        verbose_name_plural = '用户配置'

    def __str__(self):
        return f"{self.user.email} 的配置"