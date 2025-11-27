from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class WeatherRecord(models.Model):
    """天气记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weather_records')
    city = models.CharField(max_length=100, verbose_name='城市')
    country = models.CharField(max_length=50, verbose_name='国家')
    
    # 天气数据
    temperature = models.FloatField(verbose_name='温度(°C)')
    feels_like = models.FloatField(verbose_name='体感温度(°C)')
    humidity = models.IntegerField(verbose_name='湿度(%)')
    pressure = models.FloatField(verbose_name='气压(hPa)')
    wind_speed = models.FloatField(verbose_name='风速(m/s)')
    wind_direction = models.IntegerField(verbose_name='风向(度)')
    visibility = models.FloatField(null=True, blank=True, verbose_name='能见度(km)')
    
    # 天气状况
    weather_main = models.CharField(max_length=50, verbose_name='主要天气')
    weather_description = models.CharField(max_length=100, verbose_name='天气描述')
    weather_icon = models.CharField(max_length=10, verbose_name='天气图标代码')
    
    # 时间信息
    sunrise = models.DateTimeField(verbose_name='日出时间')
    sunset = models.DateTimeField(verbose_name='日落时间')
    data_time = models.DateTimeField(verbose_name='数据时间')
    
    # API信息
    provider = models.CharField(max_length=50, default='openweather', verbose_name='数据提供商')
    api_response = models.JSONField(default=dict, verbose_name='API响应原始数据')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'weather_records'
        verbose_name = '天气记录'
        verbose_name_plural = '天气记录'
        ordering = ['-data_time']
    
    def __str__(self):
        return f"{self.city} - {self.weather_main} {self.temperature}°C"

class TranslationRecord(models.Model):
    """翻译记录"""
    LANGUAGE_CHOICES = [
        ('zh', '中文'),
        ('en', '英语'),
        ('ja', '日语'),
        ('ko', '韩语'),
        ('fr', '法语'),
        ('de', '德语'),
        ('es', '西班牙语'),
        ('ru', '俄语'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='translation_records')
    
    # 翻译内容
    source_text = models.TextField(verbose_name='原文')
    target_text = models.TextField(verbose_name='译文')
    source_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, verbose_name='源语言')
    target_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, verbose_name='目标语言')
    
    # 翻译信息
    provider = models.CharField(max_length=50, default='google', verbose_name='翻译服务提供商')
    confidence = models.FloatField(null=True, blank=True, verbose_name='置信度')
    processing_time = models.FloatField(null=True, blank=True, verbose_name='处理时间(秒)')
    
    # API信息
    api_response = models.JSONField(default=dict, verbose_name='API响应原始数据')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'translation_records'
        verbose_name = '翻译记录'
        verbose_name_plural = '翻译记录'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_source_language_display()} -> {self.get_target_language_display()}"

class MapLocation(models.Model):
    """地图位置记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='map_locations')
    name = models.CharField(max_length=200, verbose_name='位置名称')
    description = models.TextField(blank=True, verbose_name='位置描述')
    
    # 地理信息
    latitude = models.DecimalField(max_digits=10, decimal_places=7, verbose_name='纬度')
    longitude = models.DecimalField(max_digits=10, decimal_places=7, verbose_name='经度')
    address = models.TextField(verbose_name='详细地址')
    city = models.CharField(max_length=100, verbose_name='城市')
    province = models.CharField(max_length=100, verbose_name='省份')
    country = models.CharField(max_length=50, verbose_name='国家')
    postal_code = models.CharField(max_length=20, blank=True, verbose_name='邮政编码')
    
    # 位置类型
    location_type = models.CharField(max_length=50, verbose_name='位置类型')
    category = models.CharField(max_length=50, blank=True, verbose_name='分类')
    
    # API信息
    provider = models.CharField(max_length=50, default='baidu', verbose_name='地图服务提供商')
    api_response = models.JSONField(default=dict, verbose_name='API响应原始数据')
    
    # 标签和元数据
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='元数据')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'map_locations'
        verbose_name = '地图位置'
        verbose_name_plural = '地图位置'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.address}"