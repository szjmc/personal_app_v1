from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Tag(models.Model):
    """标签模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name='标签名称')
    color = models.CharField(max_length=7, default='#666666', verbose_name='颜色')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tags')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tags'
        verbose_name = '标签'
        verbose_name_plural = '标签'
        unique_together = ['name', 'creator']

    def __str__(self):
        return self.name


class Note(models.Model):
    """笔记模型"""
    FORMAT_TYPES = [
        ('richtext', '富文本'),
        ('markdown', 'Markdown'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    format_type = models.CharField(max_length=20, choices=FORMAT_TYPES, default='richtext', verbose_name='格式类型')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    tags = models.ManyToManyField(Tag, related_name='notes', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'
        verbose_name = '笔记'
        verbose_name_plural = '笔记'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class NoteLink(models.Model):
    """笔记双向链接"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='outgoing_links')
    to_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='incoming_links')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'note_links'
        verbose_name = '笔记链接'
        verbose_name_plural = '笔记链接'
        unique_together = ['from_note', 'to_note']


class NoteVersion(models.Model):
    """笔记版本历史"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(verbose_name='版本号')
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    modifier = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'note_versions'
        verbose_name = '笔记版本'
        verbose_name_plural = '笔记版本'
        ordering = ['-created_at']
        unique_together = ['note', 'version_number']


class Resource(models.Model):
    """资源文件模型"""
    RESOURCE_TYPES = [
        ('document', '文档'),
        ('image', '图片'),
        ('video', '视频'),
        ('audio', '音频'),
        ('other', '其他'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, verbose_name='文件名')
    file = models.FileField(upload_to='resources/', verbose_name='文件')
    file_type = models.CharField(max_length=20, choices=RESOURCE_TYPES, verbose_name='文件类型')
    file_size = models.BigIntegerField(verbose_name='文件大小')
    description = models.TextField(blank=True, verbose_name='描述')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resources')
    tags = models.ManyToManyField(Tag, related_name='resources', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resources'
        verbose_name = '资源'
        verbose_name_plural = '资源'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class OCRResult(models.Model):
    """OCR识别结果"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to='ocr_images/', verbose_name='图片')
    recognized_text = models.TextField(verbose_name='识别文本')
    confidence = models.FloatField(default=0, verbose_name='置信度')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ocr_results')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ocr_results'
        verbose_name = 'OCR结果'
        verbose_name_plural = 'OCR结果'
        ordering = ['-created_at']