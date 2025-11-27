from rest_framework import serializers
from .models import OCRImage

class OCRImageSerializer(serializers.ModelSerializer):
    """OCR图片识别序列化器"""
    image_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = OCRImage
        fields = [
            'id', 'title', 'image', 'image_url', 'original_filename', 
            'file_size', 'file_size_display', 'extracted_text', 
            'confidence_score', 'status', 'status_display', 
            'error_message', 'ocr_provider', 'processing_time',
            'tags', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'extracted_text', 'confidence_score', 'status',
            'error_message', 'processing_time', 'created_at', 'updated_at'
        ]
    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            url = obj.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None
    
    def get_file_size_display(self, obj):
        """格式化文件大小显示"""
        if obj.file_size:
            for unit in ['B', 'KB', 'MB', 'GB']:
                if obj.file_size < 1024.0:
                    return f"{obj.file_size:.2f} {unit}"
                obj.file_size /= 1024.0
            return f"{obj.file_size:.2f} TB"
        return "0 B"
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class OCRImageCreateSerializer(serializers.ModelSerializer):
    """OCR图片创建序列化器"""
    
    class Meta:
        model = OCRImage
        fields = ['title', 'image', 'tags', 'metadata']
    
    def validate_image(self, value):
        """验证图片格式和大小"""
        # 检查文件大小 (限制10MB)
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(f"图片文件大小不能超过10MB")
        
        # 检查文件格式
        valid_formats = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in valid_formats:
            raise serializers.ValidationError(f"不支持的图片格式，支持的格式：{', '.join(valid_formats)}")
        
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['original_filename'] = validated_data['image'].name
        validated_data['file_size'] = validated_data['image'].size
        
        return super().create(validated_data)