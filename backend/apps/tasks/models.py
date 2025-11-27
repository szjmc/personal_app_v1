from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Project(models.Model):
    """项目模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='项目名称')
    description = models.TextField(blank=True, verbose_name='项目描述')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    members = models.ManyToManyField(User, related_name='joined_projects', blank=True)
    start_date = models.DateField(null=True, blank=True, verbose_name='开始日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='结束日期')
    status = models.CharField(
        max_length=20,
        choices=[
            ('planning', '规划中'),
            ('active', '进行中'),
            ('completed', '已完成'),
            ('archived', '已归档'),
        ],
        default='planning',
        verbose_name='状态'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-updated_at']

    def __str__(self):
        return self.name

    @property
    def completion_rate(self):
        """项目完成率"""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0.0
        completed_tasks = self.tasks.filter(status='completed').count()
        return round((completed_tasks / total_tasks) * 100, 1)


class Task(models.Model):
    """任务模型"""
    PRIORITY_CHOICES = [
        ('high', '高'),
        ('medium', '中'),
        ('low', '低'),
    ]

    STATUS_CHOICES = [
        ('todo', '待办'),
        ('in_progress', '进行中'),
        ('blocked', '阻塞'),
        ('completed', '已完成'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name='任务标题')
    description = models.TextField(blank=True, verbose_name='任务描述')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', verbose_name='状态')
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='截止时间')
    
    # 层级关系
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    
    # 关联人员
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    
    # 时间信息
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tasks'
        verbose_name = '任务'
        verbose_name_plural = '任务'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        """是否逾期"""
        if self.due_date and self.status != 'completed':
            from django.utils import timezone
            return self.due_date < timezone.now()
        return False

    @property
    def completion_rate(self):
        """子任务完成率"""
        total_children = self.children.count()
        if total_children == 0:
            return 100 if self.status == 'completed' else 0
        completed_children = self.children.filter(status='completed').count()
        return round((completed_children / total_children) * 100, 1)


class TaskDependency(models.Model):
    """任务依赖关系"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependents')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_dependencies'
        verbose_name = '任务依赖'
        verbose_name_plural = '任务依赖'
        unique_together = ['task', 'depends_on']

    def clean(self):
        """验证依赖关系"""
        if self.task == self.depends_on:
            raise ValueError('任务不能依赖自己')
        if self.depends_on.status == 'completed':
            raise ValueError('不能依赖已完成的任务')


class TaskComment(models.Model):
    """任务评论"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(verbose_name='评论内容')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'task_comments'
        verbose_name = '任务评论'
        verbose_name_plural = '任务评论'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task.title} - {self.author.email}"


class TaskFile(models.Model):
    """任务附件"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='task_files/')
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_files'
        verbose_name = '任务附件'
        verbose_name_plural = '任务附件'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.task.title} - {self.filename}"