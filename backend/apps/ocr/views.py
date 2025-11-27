import os
import time
import json
import base64
from datetime import datetime
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from .models import OCRImage
from .serializers import OCRImageSerializer, OCRImageCreateSerializer
from .ocr_service import OCRService

class OCRImageListCreateView(generics.ListCreateAPIView):
    """OCR图片列表和创建视图"""
    serializer_class = OCRImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = OCRImage.objects.filter(user=self.request.user)
        
        # 按状态筛选
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 按标签筛选
        tags = self.request.query_params.get('tags')
        if tags:
            tag_list = tags.split(',')
            queryset = queryset.filter(tags__contains=tag_list)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OCRImageCreateSerializer
        return OCRImageSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ocr_image = serializer.save()
        
        # 异步执行OCR识别
        try:
            ocr_service = OCRService()
            result = ocr_service.process_image(ocr_image)
            
            # 更新识别结果
            ocr_image.extracted_text = result.get('text', '')
            ocr_image.confidence_score = result.get('confidence', 0)
            ocr_image.status = 'completed' if result.get('success') else 'failed'
            ocr_image.processing_time = result.get('processing_time', 0)
            ocr_image.metadata.update(result.get('metadata', {}))
            ocr_image.save()
            
            return Response(
                OCRImageSerializer(ocr_image, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            ocr_image.status = 'failed'
            ocr_image.error_message = str(e)
            ocr_image.save()
            
            return Response(
                {'error': f'OCR识别失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class OCRImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """OCR图片详情视图"""
    serializer_class = OCRImageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OCRImage.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_ocr_image(request, image_id):
    """手动重新处理OCR识别"""
    try:
        ocr_image = OCRImage.objects.get(id=image_id, user=request.user)
        
        # 重置状态
        ocr_image.status = 'processing'
        ocr_image.error_message = ''
        ocr_image.save()
        
        # 执行OCR识别
        ocr_service = OCRService()
        result = ocr_service.process_image(ocr_image)
        
        # 更新结果
        ocr_image.extracted_text = result.get('text', '')
        ocr_image.confidence_score = result.get('confidence', 0)
        ocr_image.status = 'completed' if result.get('success') else 'failed'
        ocr_image.processing_time = result.get('processing_time', 0)
        ocr_image.metadata.update(result.get('metadata', {}))
        
        if not result.get('success'):
            ocr_image.error_message = result.get('error', '识别失败')
        
        ocr_image.save()
        
        return Response(OCRImageSerializer(ocr_image, context={'request': request}).data)
    
    except OCRImage.DoesNotExist:
        return Response({'error': '图片不存在'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'处理失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_ocr_text(request, image_id):
    """导出OCR识别的文本"""
    try:
        ocr_image = OCRImage.objects.get(id=image_id, user=request.user)
        
        export_format = request.query_params.get('format', 'txt')
        
        if export_format == 'txt':
            response = Response(ocr_image.extracted_text, content_type='text/plain')
            filename = f"{ocr_image.title}.txt"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        elif export_format == 'json':
            data = {
                'title': ocr_image.title,
                'extracted_text': ocr_image.extracted_text,
                'confidence_score': ocr_image.confidence_score,
                'metadata': ocr_image.metadata,
                'created_at': ocr_image.created_at.isoformat()
            }
            response = Response(data, content_type='application/json')
            filename = f"{ocr_image.title}.json"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        else:
            return Response({'error': '不支持的导出格式'}, status=status.HTTP_400_BAD_REQUEST)
    
    except OCRImage.DoesNotExist:
        return Response({'error': '图片不存在'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_ocr_process(request):
    """批量OCR识别"""
    image_ids = request.data.get('image_ids', [])
    
    if not image_ids:
        return Response({'error': '请提供图片ID列表'}, status=status.HTTP_400_BAD_REQUEST)
    
    results = []
    errors = []
    
    for image_id in image_ids:
        try:
            ocr_image = OCRImage.objects.get(id=image_id, user=request.user)
            
            # 异步处理
            ocr_service = OCRService()
            result = ocr_service.process_image(ocr_image)
            
            # 更新结果
            ocr_image.extracted_text = result.get('text', '')
            ocr_image.confidence_score = result.get('confidence', 0)
            ocr_image.status = 'completed' if result.get('success') else 'failed'
            ocr_image.processing_time = result.get('processing_time', 0)
            ocr_image.metadata.update(result.get('metadata', {}))
            ocr_image.save()
            
            results.append({
                'id': str(ocr_image.id),
                'success': result.get('success', False),
                'status': ocr_image.status
            })
            
        except Exception as e:
            errors.append({
                'id': image_id,
                'error': str(e)
            })
    
    return Response({
        'processed': len(results),
        'errors': len(errors),
        'results': results,
        'error_details': errors
    })