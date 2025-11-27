import django_filters
from .models import Task, Project


class TaskFilter(django_filters.FilterSet):
    """任务过滤器"""
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    due_after = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    due_before = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    
    class Meta:
        model = Task
        fields = {
            'status': ['exact'],
            'priority': ['exact'],
            'project': ['exact'],
            'creator': ['exact'],
            'assignee': ['exact'],
            'parent': ['exact'],
        }