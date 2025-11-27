from django.db import models
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from .models import Project, Task, TaskDependency, TaskComment, TaskFile
from .serializers import (
    ProjectSerializer, TaskSerializer, TaskCreateSerializer, 
    TaskUpdateSerializer, TaskDetailSerializer, TaskDependencySerializer,
    TaskCommentSerializer, TaskFileSerializer, TaskBoardSerializer
)
from .filters import TaskFilter


@extend_schema(tags=['项目管理'])
class ProjectViewSet(viewsets.ModelViewSet):
    """项目视图集"""
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'creator']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-updated_at']

    def get_queryset(self):
        return Project.objects.filter(
            models.Q(creator=self.request.user) | 
            models.Q(members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """添加项目成员"""
        project = self.get_object()
        email = request.data.get('email')
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(email=email)
            project.members.add(user)
            return Response({'message': '成员添加成功'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """移除项目成员"""
        project = self.get_object()
        email = request.data.get('email')
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(email=email)
            project.members.remove(user)
            return Response({'message': '成员移除成功'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['任务管理'])
class TaskViewSet(viewsets.ModelViewSet):
    """任务视图集"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        return Task.objects.filter(
            models.Q(creator=self.request.user) | 
            models.Q(assignee=self.request.user) |
            models.Q(project__members=self.request.user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        elif self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """添加评论"""
        task = self.get_object()
        serializer = TaskCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        """上传文件"""
        task = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': '请选择文件'}, status=status.HTTP_400_BAD_REQUEST)

        file_data = {
            'task': task.id,
            'file': file_obj,
            'filename': file_obj.name,
            'file_size': file_obj.size,
            'uploaded_by': request.user.id
        }
        
        serializer = TaskFileSerializer(data=file_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def board(self, request):
        """获取看板数据"""
        queryset = self.get_queryset()
        tasks = TaskBoardSerializer(queryset, many=True).data
        
        # 按状态分组
        board_data = {
            'todo': [],
            'in_progress': [],
            'blocked': [],
            'completed': []
        }
        
        for task in tasks:
            board_data[task['status']].append(task)
        
        return Response(board_data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """更新任务状态"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['todo', 'in_progress', 'blocked', 'completed']:
            return Response({'error': '无效的状态值'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查权限
        if task.creator != request.user and (not task.project or request.user not in task.project.members.all()):
            return Response({'error': '无权限修改此任务'}, status=status.HTTP_403_FORBIDDEN)
        
        task.status = new_status
        if new_status == 'completed' and not task.completed_at:
            from django.utils import timezone
            task.completed_at = timezone.now()
        task.save()
        
        return Response({'message': '状态更新成功'})

    @action(detail=True, methods=['post'])
    def add_dependency(self, request, pk=None):
        """添加任务依赖"""
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        try:
            depends_on_task = Task.objects.get(id=depends_on_id)
            
            # 检查循环依赖
            if self._check_circular_dependency(task, depends_on_task):
                return Response({'error': '不能创建循环依赖'}, status=status.HTTP_400_BAD_REQUEST)
            
            dependency = TaskDependency.objects.create(
                task=task,
                depends_on=depends_on_task
            )
            return Response(TaskDependencySerializer(dependency).data)
            
        except Task.DoesNotExist:
            return Response({'error': '依赖任务不存在'}, status=status.HTTP_404_NOT_FOUND)

    def _check_circular_dependency(self, task, depends_on):
        """检查循环依赖"""
        visited = set()
        
        def dfs(current):
            if current.id in visited:
                return True
            visited.add(current.id)
            
            for dep in current.dependencies.all():
                if dfs(dep.depends_on):
                    return True
            return False
        
        temp_dep = TaskDependency(task=depends_on, depends_on=task)
        return dfs(depends_on)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """获取今日任务"""
        from django.utils import timezone
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__date=today
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def todo(self, request):
        """获取待办任务"""
        tasks = self.get_queryset().filter(
            status='todo'
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """获取已完成任务"""
        tasks = self.get_queryset().filter(
            status='completed'
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


@extend_schema(tags=['任务管理'])
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_statistics(request):
    """获取任务统计"""
    user_tasks = Task.objects.filter(
        models.Q(creator=request.user) | 
        models.Q(assignee=request.user)
    ).distinct()
    
    stats = {
        'total': user_tasks.count(),
        'todo': user_tasks.filter(status='todo').count(),
        'in_progress': user_tasks.filter(status='in_progress').count(),
        'blocked': user_tasks.filter(status='blocked').count(),
        'completed': user_tasks.filter(status='completed').count(),
        'overdue': len([task for task in user_tasks if task.is_overdue]),
    }
    
    return Response(stats)