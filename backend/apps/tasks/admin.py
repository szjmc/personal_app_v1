from django.contrib import admin
from .models import Project, Task, TaskDependency, TaskComment, TaskFile


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'status', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'description')
    date_hierarchy = 'created_at'
    filter_horizontal = ('members',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'assignee', 'status', 'priority', 'due_date', 'project', 'is_overdue')
    list_filter = ('status', 'priority', 'created_at', 'due_date')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'
    raw_id_fields = ('parent', 'project', 'creator', 'assignee')


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ('task', 'depends_on', 'created_at')
    raw_id_fields = ('task', 'depends_on')


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content',)
    raw_id_fields = ('task', 'author')


@admin.register(TaskFile)
class TaskFileAdmin(admin.ModelAdmin):
    list_display = ('task', 'filename', 'file_size', 'uploaded_by', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('filename',)
    raw_id_fields = ('task', 'uploaded_by')