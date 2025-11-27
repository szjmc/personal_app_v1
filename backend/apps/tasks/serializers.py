from rest_framework import serializers
from .models import Project, Task, TaskDependency, TaskComment, TaskFile


class ProjectSerializer(serializers.ModelSerializer):
    """项目序列化器"""
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    completion_rate = serializers.ReadOnlyField()
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('id', 'creator', 'created_at', 'updated_at')

    def get_task_count(self, obj):
        return obj.tasks.count()


class TaskSerializer(serializers.ModelSerializer):
    """任务序列化器"""
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'creator', 'created_at', 'updated_at', 'completed_at')

    def get_children_count(self, obj):
        return obj.children.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """任务创建序列化器"""
    class Meta:
        model = Task
        fields = ('title', 'description', 'priority', 'status', 'due_date', 
                 'parent', 'project', 'assignee')


class TaskUpdateSerializer(serializers.ModelSerializer):
    """任务更新序列化器"""
    class Meta:
        model = Task
        fields = ('title', 'description', 'priority', 'status', 'due_date', 
                 'parent', 'project', 'assignee')


class TaskDetailSerializer(TaskSerializer):
    """任务详情序列化器"""
    children = TaskSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    dependencies = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = '__all__'

    def get_comments(self, obj):
        comments = obj.comments.all()
        return TaskCommentSerializer(comments, many=True).data

    def get_files(self, obj):
        files = obj.files.all()
        return TaskFileSerializer(files, many=True).data

    def get_dependencies(self, obj):
        dependencies = obj.dependencies.all()
        return TaskDependencySerializer(dependencies, many=True).data


class TaskDependencySerializer(serializers.ModelSerializer):
    """任务依赖序列化器"""
    task_title = serializers.CharField(source='task.title', read_only=True)
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class TaskCommentSerializer(serializers.ModelSerializer):
    """任务评论序列化器"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')


class TaskFileSerializer(serializers.ModelSerializer):
    """任务文件序列化器"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = TaskFile
        fields = '__all__'
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'file_size')


class TaskBoardSerializer(serializers.ModelSerializer):
    """任务看板序列化器"""
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    
    class Meta:
        model = Task
        fields = ('id', 'title', 'priority', 'status', 'due_date', 'creator_name', 
                 'assignee_name', 'is_overdue', 'parent', 'project')
        read_only_fields = ('id', 'creator_name', 'is_overdue')