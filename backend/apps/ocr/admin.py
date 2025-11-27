from django.contrib import admin
from .models import OCRImage

@admin.register(OCRImage)
class OCRImageAdmin(admin.ModelAdmin):
    """OCR图片管理界面"""
    list_display = [
        'title', 'user', 'status', 'confidence_score', 
        'ocr_provider', 'processing_time', 'created_at'
    ]
    list_filter = ['status', 'ocr_provider', 'created_at', 'user']
    search_fields = ['title', 'extracted_text', 'original_filename']
    readonly_fields = [
        'id', 'file_size', 'processing_time', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'user', 'image', 'original_filename', 'file_size')
        }),
        ('OCR结果', {
            'fields': ('extracted_text', 'confidence_score', 'status', 'error_message')
        }),
        ('处理信息', {
            'fields': ('ocr_provider', 'processing_time')
        }),
        ('元数据', {
            'fields': ('tags', 'metadata'),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj:  # 编辑时
            readonly.extend(['image', 'extracted_text', 'confidence_score', 'status'])
        return readonly