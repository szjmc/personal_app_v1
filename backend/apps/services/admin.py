from django.contrib import admin
from .models import WeatherRecord, TranslationRecord, MapLocation

@admin.register(WeatherRecord)
class WeatherRecordAdmin(admin.ModelAdmin):
    """天气记录管理界面"""
    list_display = [
        'city', 'country', 'temperature', 'weather_main', 
        'provider', 'data_time', 'user'
    ]
    list_filter = ['provider', 'weather_main', 'country', 'data_time', 'user']
    search_fields = ['city', 'country', 'weather_description']
    readonly_fields = ['id', 'api_response', 'created_at']
    
    fieldsets = (
        ('位置信息', {
            'fields': ('user', 'city', 'country', 'provider')
        }),
        ('天气数据', {
            'fields': (
                'temperature', 'feels_like', 'humidity', 'pressure',
                'wind_speed', 'wind_direction', 'visibility'
            )
        }),
        ('天气状况', {
            'fields': ('weather_main', 'weather_description', 'weather_icon')
        }),
        ('时间信息', {
            'fields': ('sunrise', 'sunset', 'data_time')
        }),
        ('API信息', {
            'fields': ('api_response',),
            'classes': ('collapse',)
        }),
        ('系统信息', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(TranslationRecord)
class TranslationRecordAdmin(admin.ModelAdmin):
    """翻译记录管理界面"""
    list_display = [
        'source_language', 'target_language', 'source_text_preview',
        'target_text_preview', 'provider', 'user', 'created_at'
    ]
    list_filter = ['provider', 'source_language', 'target_language', 'created_at', 'user']
    search_fields = ['source_text', 'target_text']
    readonly_fields = ['id', 'api_response', 'created_at']
    
    def source_text_preview(self, obj):
        return obj.source_text[:50] + '...' if len(obj.source_text) > 50 else obj.source_text
    source_text_preview.short_description = '原文预览'
    
    def target_text_preview(self, obj):
        return obj.target_text[:50] + '...' if len(obj.target_text) > 50 else obj.target_text
    target_text_preview.short_description = '译文预览'
    
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'source_language', 'target_language', 'provider')
        }),
        ('翻译内容', {
            'fields': ('source_text', 'target_text')
        }),
        ('翻译信息', {
            'fields': ('confidence', 'processing_time')
        }),
        ('API信息', {
            'fields': ('api_response',),
            'classes': ('collapse',)
        }),
        ('系统信息', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(MapLocation)
class MapLocationAdmin(admin.ModelAdmin):
    """地图位置管理界面"""
    list_display = [
        'name', 'city', 'province', 'country', 
        'location_type', 'provider', 'user', 'created_at'
    ]
    list_filter = ['provider', 'location_type', 'country', 'created_at', 'user']
    search_fields = ['name', 'address', 'city', 'province']
    readonly_fields = ['id', 'api_response', 'created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'name', 'description', 'provider')
        }),
        ('地理信息', {
            'fields': (
                'latitude', 'longitude', 'address', 'city',
                'province', 'country', 'postal_code'
            )
        }),
        ('分类信息', {
            'fields': ('location_type', 'category')
        }),
        ('标签和元数据', {
            'fields': ('tags', 'metadata'),
            'classes': ('collapse',)
        }),
        ('API信息', {
            'fields': ('api_response',),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )