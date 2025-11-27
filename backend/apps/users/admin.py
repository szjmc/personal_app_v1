from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'timezone', 'theme', 'is_active', 'date_joined')
    list_filter = ('is_active', 'theme', 'timezone')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('avatar', 'timezone', 'theme')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_enabled', 'language', 'working_hours_start', 'working_hours_end')
    list_filter = ('notification_enabled', 'email_notifications', 'push_notifications', 'language')
    search_fields = ('user__email',)