from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Note, Tag, Resource
from .serializers import NoteSerializer, TagSerializer, ResourceSerializer
from drf_spectacular.utils import extend_schema


class NoteViewSet(viewsets.ModelViewSet):
    """笔记视图集"""
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['format_type', 'tags']

    def get_queryset(self):
        return Note.objects.filter(creator=self.request.user).prefetch_related('tags')

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def add_link(self, request, pk=None):
        """添加笔记链接"""
        note = self.get_object()
        to_note_id = request.data.get('to_note_id')
        
        try:
            to_note = Note.objects.get(id=to_note_id, creator=request.user)
            # 这里创建双向链接逻辑
            return Response({'message': '链接添加成功'})
        except Note.DoesNotExist:
            return Response({'error': '目标笔记不存在'}, status=status.HTTP_404_NOT_FOUND)


class TagViewSet(viewsets.ModelViewSet):
    """标签视图集"""
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class ResourceViewSet(viewsets.ModelViewSet):
    """资源视图集"""
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['file_type']

    def get_queryset(self):
        return Resource.objects.filter(creator=self.request.user).prefetch_related('tags')

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


@extend_schema(tags=['知识管理'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ocr_upload(request):
    """OCR识别上传"""
    # 这里实现OCR识别逻辑
    return Response({'message': 'OCR功能开发中'})