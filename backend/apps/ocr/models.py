from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class OCRImage(models.Model):
    """OCR图片识别记录"""
    STATUS_CHOICES = [
        ('pending', '待识别'),
        ('processing', '识别中'),
        ('completed', '已完成'),
        ('failed', '识别失败'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ocr_images')
    title = models.CharField(max_length=200, verbose_name='标题')
    image = models.ImageField(upload_to='ocr_images/%Y/%m/', verbose_name='图片')
    original_filename = models.CharField(max_length=255, verbose_name='原始文件名')
    file_size = models.IntegerField(verbose_name='文件大小(字节)')
    
    # OCR相关字段
    extracted_text = models.TextField(blank=True, verbose_name='识别文本')
    confidence_score = models.FloatField(null=True, blank=True, verbose_name='置信度')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    
    # 处理信息
    ocr_provider = models.CharField(max_length=50, default='tesseract', verbose_name='OCR提供商')
    processing_time = models.FloatField(null=True, blank=True, verbose_name='处理时间(秒)')
    
    # 元数据
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='元数据')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ocr_images'
        verbose_name = 'OCR识别记录'
        verbose_name_plural = 'OCR识别记录'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"