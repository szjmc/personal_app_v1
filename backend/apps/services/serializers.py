from rest_framework import serializers
from .models import WeatherRecord, TranslationRecord, MapLocation

class WeatherRecordSerializer(serializers.ModelSerializer):
    """天气记录序列化器"""
    weather_display = serializers.SerializerMethodField()
    temperature_display = serializers.SerializerMethodField()
    wind_direction_display = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()
    
    class Meta:
        model = WeatherRecord
        fields = [
            'id', 'city', 'country', 'temperature', 'feels_like', 
            'humidity', 'pressure', 'wind_speed', 'wind_direction',
            'wind_direction_display', 'visibility', 'weather_main',
            'weather_description', 'weather_icon', 'weather_display',
            'sunrise', 'sunset', 'data_time', 'provider', 'created_at',
            'created_at_display'
        ]
        read_only_fields = ['id', 'api_response', 'created_at']
    
    def get_weather_display(self, obj):
        return f"{obj.weather_description} {obj.temperature}°C"
    
    def get_temperature_display(self, obj):
        return f"{obj.temperature}°C (体感 {obj.feels_like}°C)"
    
    def get_wind_direction_display(self, obj):
        directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
        index = round(obj.wind_direction / 45) % 8
        return f"{directions[index]} ({obj.wind_direction}°)"
    
    def get_created_at_display(self, obj):
        return obj.created_at.strftime('%m-%d %H:%M')

class WeatherQuerySerializer(serializers.Serializer):
    """天气查询序列化器"""
    city = serializers.CharField(max_length=100, required=True)
    country = serializers.CharField(max_length=50, required=False, allow_blank=True)
    units = serializers.ChoiceField(choices=['metric', 'imperial', 'kelvin'], default='metric')

class TranslationRecordSerializer(serializers.ModelSerializer):
    """翻译记录序列化器"""
    source_language_display = serializers.SerializerMethodField()
    target_language_display = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()
    
    class Meta:
        model = TranslationRecord
        fields = [
            'id', 'source_text', 'target_text', 'source_language',
            'target_language', 'source_language_display', 
            'target_language_display', 'provider', 'confidence',
            'processing_time', 'created_at', 'created_at_display'
        ]
        read_only_fields = ['id', 'api_response', 'created_at']
    
    def get_source_language_display(self, obj):
        return obj.get_source_language_display()
    
    def get_target_language_display(self, obj):
        return obj.get_target_language_display()
    
    def get_created_at_display(self, obj):
        return obj.created_at.strftime('%m-%d %H:%M')

class TranslationRequestSerializer(serializers.Serializer):
    """翻译请求序列化器"""
    text = serializers.CharField(required=True)
    source_language = serializers.CharField(required=False)
    target_language = serializers.CharField(required=True)
    provider = serializers.ChoiceField(
        choices=['google', 'baidu', 'tencent'], 
        default='google'
    )

class MapLocationSerializer(serializers.ModelSerializer):
    """地图位置序列化器"""
    coordinates = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MapLocation
        fields = [
            'id', 'name', 'description', 'coordinates', 'latitude',
            'longitude', 'address', 'city', 'province', 'country',
            'postal_code', 'location_type', 'category', 'provider',
            'tags', 'metadata', 'created_at', 'updated_at',
            'created_at_display'
        ]
        read_only_fields = ['id', 'api_response', 'created_at', 'updated_at']
    
    def get_coordinates(self, obj):
        return {
            'lat': float(obj.latitude),
            'lng': float(obj.longitude)
        }
    
    def get_created_at_display(self, obj):
        return obj.created_at.strftime('%m-%d %H:%M')

class MapSearchSerializer(serializers.Serializer):
    """地图搜索序列化器"""
    query = serializers.CharField(required=True)
    city = serializers.CharField(required=False)
    region = serializers.CharField(required=False)
    provider = serializers.ChoiceField(
        choices=['baidu', 'google', 'amap'], 
        default='baidu'
    )

class GeocodeRequestSerializer(serializers.Serializer):
    """地理编码请求序列化器"""
    address = serializers.CharField(required=True)
    provider = serializers.ChoiceField(
        choices=['baidu', 'google', 'amap'], 
        default='baidu'
    )