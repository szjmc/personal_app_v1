from django.urls import path
from . import views

urlpatterns = [
    path('', views.OCRImageListCreateView.as_view(), name='ocr-image-list-create'),
    path('<uuid:pk>/', views.OCRImageDetailView.as_view(), name='ocr-image-detail'),
    path('<uuid:image_id>/process/', views.process_ocr_image, name='process-ocr-image'),
    path('<uuid:image_id>/export/', views.export_ocr_text, name='export-ocr-text'),
    path('batch-process/', views.batch_ocr_process, name='batch-ocr-process'),
]