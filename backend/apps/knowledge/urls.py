from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notes', views.NoteViewSet, basename='note')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'resources', views.ResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
    path('ocr/', views.ocr_upload, name='ocr-upload'),
]