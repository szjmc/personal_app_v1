from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from django.http import JsonResponse

def api_info(request):
    """API根路径信息"""
    return JsonResponse({
        'message': '个人管理应用 API',
        'version': '1.0.0',
        'endpoints': {
            'docs': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/',
            'auth': '/api/auth/',
            'tasks': '/api/tasks/',
            'time': '/api/time/',
            'knowledge': '/api/knowledge/',
            'life': '/api/life/',
            'ocr': '/api/ocr/',
            'services': '/api/services/',
        },
        'frontend': '前端应用请访问: http://localhost:3000'
    })

urlpatterns = [
    path('', api_info, name='api-info'),
    path('admin/', admin.site.urls),
    
    # API文档
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API路由
    path('api/auth/', include('apps.users.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/time/', include('apps.time_management.urls')),
    path('api/knowledge/', include('apps.knowledge.urls')),
    path('api/life/', include('apps.life_management.urls')),
    path('api/ocr/', include('apps.ocr.urls')),
    path('api/services/', include('apps.services.urls')),
]

# 开发环境媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)