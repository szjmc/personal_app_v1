from django.urls import path
from . import views

urlpatterns = [
    # 天气服务
    path('weather/', views.weather_current, name='weather-current'),
    path('weather/<uuid:pk>/', views.WeatherRecordDetailView.as_view(), name='weather-detail'),
    
    # 翻译服务
    path('translation/', views.translation, name='translation'),
    path('translation/<uuid:pk>/', views.TranslationRecordDetailView.as_view(), name='translation-detail'),
    
    # 地图服务
    path('map/', views.map_locations, name='map-locations'),
    path('map/<uuid:pk>/', views.MapLocationDetailView.as_view(), name='map-detail'),
    path('map/geocode/', views.map_geocode, name='map-geocode'),
]