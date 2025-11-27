import time
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import WeatherRecord, TranslationRecord, MapLocation
from .serializers import (
    WeatherRecordSerializer, WeatherQuerySerializer,
    TranslationRecordSerializer, TranslationRequestSerializer,
    MapLocationSerializer, MapSearchSerializer, GeocodeRequestSerializer
)
from .third_party_apis import WeatherService, TranslationService, MapService

# =============== 天气服务 ===============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def weather_current(request):
    """获取或查询当前天气"""
    if request.method == 'GET':
        # 获取用户的天气记录
        queryset = WeatherRecord.objects.filter(user=request.user)
        
        # 筛选参数
        city = request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # 限制返回数量
        limit = int(request.query_params.get('limit', 20))
        records = queryset[:limit]
        serializer = WeatherRecordSerializer(records, many=True)
        
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    elif request.method == 'POST':
        # 查询新天气
        serializer = WeatherQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        city = serializer.validated_data['city']
        country = serializer.validated_data.get('country', '')
        units = serializer.validated_data.get('units', 'metric')
        
        # 调用天气API
        weather_service = WeatherService()
        result = weather_service.get_current_weather(city, country, units)
        
        if result['success']:
            # 保存到数据库
            weather_record = WeatherRecord.objects.create(
                user=request.user,
                city=result['city'],
                country=result['country'],
                temperature=result['temperature'],
                feels_like=result['feels_like'],
                humidity=result['humidity'],
                pressure=result['pressure'],
                wind_speed=result['wind_speed'],
                wind_direction=result['wind_direction'],
                visibility=result.get('visibility'),
                weather_main=result['weather_main'],
                weather_description=result['weather_description'],
                weather_icon=result['weather_icon'],
                sunrise=result['sunrise'],
                sunset=result['sunset'],
                data_time=result['data_time'],
                provider=result['provider'],
                api_response=result['api_response']
            )
            
            serializer = WeatherRecordSerializer(weather_record)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

# =============== 翻译服务 ===============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def translation(request):
    """获取翻译记录或进行翻译"""
    if request.method == 'GET':
        # 获取用户的翻译记录
        queryset = TranslationRecord.objects.filter(user=request.user)
        
        # 筛选参数
        source_lang = request.query_params.get('source_language')
        target_lang = request.query_params.get('target_language')
        
        if source_lang:
            queryset = queryset.filter(source_language=source_lang)
        if target_lang:
            queryset = queryset.filter(target_language=target_lang)
        
        # 搜索文本内容
        keyword = request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(source_text__icontains=keyword) | 
                Q(target_text__icontains=keyword)
            )
        
        # 分页
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        records = queryset[start:end]
        serializer = TranslationRecordSerializer(records, many=True)
        
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'page': page,
            'page_size': page_size
        })
    
    elif request.method == 'POST':
        # 进行翻译
        serializer = TranslationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        text = serializer.validated_data['text']
        source_lang = serializer.validated_data.get('source_language', 'auto')
        target_lang = serializer.validated_data['target_language']
        provider = serializer.validated_data.get('provider', 'google')
        
        # 调用翻译API
        start_time = time.time()
        translation_service = TranslationService(provider)
        result = translation_service.translate(text, source_lang, target_lang)
        processing_time = time.time() - start_time
        
        if result['success']:
            # 保存到数据库
            translation_record = TranslationRecord.objects.create(
                user=request.user,
                source_text=text,
                target_text=result['translated_text'],
                source_language=result['source_language'],
                target_language=result['target_language'],
                provider=result['provider'],
                confidence=result.get('detected_confidence'),
                processing_time=processing_time,
                api_response=result['api_response']
            )
            
            serializer = TranslationRecordSerializer(translation_record)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

# =============== 地图服务 ===============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def map_locations(request):
    """获取地图位置或搜索位置"""
    if request.method == 'GET':
        # 获取用户的位置记录
        queryset = MapLocation.objects.filter(user=request.user)
        
        # 筛选参数
        city = request.query_params.get('city')
        location_type = request.query_params.get('location_type')
        category = request.query_params.get('category')
        
        if city:
            queryset = queryset.filter(city__icontains=city)
        if location_type:
            queryset = queryset.filter(location_type__icontains=location_type)
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # 搜索文本
        keyword = request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(name__icontains=keyword) | 
                Q(address__icontains=keyword) |
                Q(description__icontains=keyword)
            )
        
        # 分页
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        locations = queryset[start:end]
        serializer = MapLocationSerializer(locations, many=True)
        
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'page': page,
            'page_size': page_size
        })
    
    elif request.method == 'POST':
        # 搜索位置
        serializer = MapSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        query = serializer.validated_data['query']
        city = serializer.validated_data.get('city')
        region = serializer.validated_data.get('region')
        provider = serializer.validated_data.get('provider', 'baidu')
        
        # 调用地图API
        map_service = MapService(provider)
        result = map_service.search_location(query, city, region)
        
        if result['success']:
            # 保存搜索结果到数据库（可选，根据需求）
            saved_locations = []
            for location_data in result['results']:
                try:
                    location = MapLocation.objects.create(
                        user=request.user,
                        name=location_data['name'],
                        address=location_data['address'],
                        city=location_data.get('city', ''),
                        province=location_data.get('province', ''),
                        country=location_data.get('country', ''),
                        latitude=location_data['latitude'],
                        longitude=location_data['longitude'],
                        location_type=location_data['location_type'],
                        category=location_data.get('category', ''),
                        provider=location_data['provider'],
                        api_response=result['api_response']
                    )
                    saved_locations.append(location)
                except Exception as e:
                    # 如果保存失败，记录错误但继续处理其他结果
                    continue
            
            # 返回保存的位置信息
            saved_serializer = MapLocationSerializer(saved_locations, many=True)
            return Response({
                'search_results': result['results'],
                'saved_locations': saved_serializer.data,
                'total_found': result.get('total', 0),
                'saved_count': len(saved_locations)
            })
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def map_geocode(request):
    """地理编码：地址转坐标"""
    serializer = GeocodeRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    address = serializer.validated_data['address']
    provider = serializer.validated_data.get('provider', 'baidu')
    
    # 调用地理编码API
    map_service = MapService(provider)
    result = map_service.geocode(address)
    
    if result['success']:
        # 保存到数据库
        try:
            location = MapLocation.objects.create(
                user=request.user,
                name=result['name'],
                address=result['address'],
                city=result.get('city', ''),
                province=result.get('province', ''),
                country=result.get('country', ''),
                latitude=result['latitude'],
                longitude=result['longitude'],
                location_type=result['location_type'],
                provider=result['provider'],
                api_response=result['api_response']
            )
            
            serializer = MapLocationSerializer(location)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'保存位置失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

# =============== 详情视图 ===============

class WeatherRecordDetailView(generics.RetrieveDestroyAPIView):
    """天气记录详情视图"""
    serializer_class = WeatherRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WeatherRecord.objects.filter(user=self.request.user)

class TranslationRecordDetailView(generics.RetrieveDestroyAPIView):
    """翻译记录详情视图"""
    serializer_class = TranslationRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TranslationRecord.objects.filter(user=self.request.user)

class MapLocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """地图位置详情视图"""
    serializer_class = MapLocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MapLocation.objects.filter(user=self.request.user)