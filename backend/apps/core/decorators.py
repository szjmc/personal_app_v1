import functools
import time
from django.core.cache import cache
from django.conf import settings
from django.http import HttpResponse
from rest_framework.response import Response
from .cache import APIResponseCacheManager, get_cache_ttl

def cache_response(
    ttl: Optional[int] = None,
    key_prefix: str = '',
    cache_user_specific: bool = True,
    cache_anonymous: bool = False,
    vary_on_params: list = None
):
    """
    API响应缓存装饰器
    
    Args:
        ttl: 缓存时间（秒）
        key_prefix: 缓存键前缀
        cache_user_specific: 是否按用户分别缓存
        cache_anonymous: 是否缓存匿名用户请求
        vary_on_params: 需要参与缓存的参数列表
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 如果设置了nocache参数，直接执行视图
            if request.GET.get('nocache') == '1':
                return view_func(request, *args, **kwargs)
            
            # 只缓存GET请求
            if request.method != 'GET':
                return view_func(request, *args, **kwargs)
            
            # 检查用户认证状态
            if not cache_anonymous and not request.user.is_authenticated:
                return view_func(request, *args, **kwargs)
            
            # 获取用户ID
            user_id = request.user.id if cache_user_specific and request.user.is_authenticated else None
            
            # 构建缓存键
            endpoint = f"{view_func.__module__}.{view_func.__name__}"
            if key_prefix:
                endpoint = f"{key_prefix}:{endpoint}"
            
            # 提取需要参与缓存的参数
            params = {}
            if vary_on_params:
                for param in vary_on_params:
                    if param in request.GET:
                        params[param] = request.GET[param]
            
            # 尝试获取缓存响应
            cached_data = APIResponseCacheManager.get_cached_response(
                endpoint=endpoint,
                params=params,
                user_id=user_id
            )
            
            if cached_data is not None:
                # 添加缓存头信息
                response = Response(cached_data)
                response['X-Cache'] = 'HIT'
                response['X-Cache-TTL'] = str(ttl or get_cache_ttl('default'))
                return response
            
            # 执行原始视图
            start_time = time.time()
            original_response = view_func(request, *args, **kwargs)
            processing_time = time.time() - start_time
            
            # 只缓存成功的响应
            if hasattr(original_response, 'status_code') and original_response.status_code == 200:
                # 获取响应数据
                if hasattr(original_response, 'data'):
                    response_data = original_response.data
                else:
                    # 对于非DRF响应，尝试获取内容
                    try:
                        if hasattr(original_response, 'content'):
                            import json
                            response_data = json.loads(original_response.content.decode())
                        else:
                            return original_response
                    except:
                        return original_response
                
                # 添加缓存信息
                cache_metadata = {
                    'cached_at': time.time(),
                    'processing_time': processing_time,
                    'cache_ttl': ttl or get_cache_ttl('default')
                }
                
                if isinstance(response_data, dict):
                    response_data['_cache_metadata'] = cache_metadata
                else:
                    response_data = {
                        'data': response_data,
                        '_cache_metadata': cache_metadata
                    }
                
                # 设置缓存
                cache_ttl = ttl or get_cache_ttl('default')
                APIResponseCacheManager.set_cached_response(
                    endpoint=endpoint,
                    response_data=response_data,
                    params=params,
                    user_id=user_id,
                    timeout=cache_ttl
                )
                
                # 添加缓存头信息到原始响应
                original_response['X-Cache'] = 'MISS'
                original_response['X-Cache-TTL'] = str(cache_ttl)
            
            return original_response
        
        return wrapper
    return decorator

def cache_queryset(
    ttl: Optional[int] = None,
    key_prefix: str = '',
    user_specific: bool = True,
    filter_fields: list = None
):
    """
    数据库查询缓存装饰器
    
    Args:
        ttl: 缓存时间（秒）
        key_prefix: 缓存键前缀
        user_specific: 是否按用户分别缓存
        filter_fields: 需要参与缓存的字段列表
    """
    def decorator(method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            # 获取模型名称
            model_name = self.queryset.model.__name__.lower()
            
            # 获取用户ID
            user_id = None
            if user_specific and hasattr(self, 'request'):
                user_id = getattr(self.request.user, 'id', None)
            
            # 构建查询参数
            query_params = {}
            if filter_fields:
                for field in filter_fields:
                    if hasattr(self, field):
                        value = getattr(self, field)
                        if value is not None:
                            query_params[field] = value
                    elif field in kwargs:
                        query_params[field] = kwargs[field]
            
            # 尝试获取缓存的查询结果
            from .cache import DatabaseQueryCacheManager
            cached_queryset = DatabaseQueryCacheManager.get_cached_queryset(
                model_name=model_name,
                query_params=query_params,
                user_id=user_id
            )
            
            if cached_queryset is not None:
                # 返回缓存的结果
                if hasattr(self, 'get_queryset'):
                    # 对于ViewSet，我们需要返回QuerySet
                    from django.db.models import QuerySet
                    if isinstance(cached_queryset, list):
                        # 转换为QuerySet
                        original_queryset = method(self, *args, **kwargs)
                        return original_queryset.model.objects.filter(
                            id__in=[item.id for item in cached_queryset if hasattr(item, 'id')]
                        )
                return cached_queryset
            
            # 执行原始查询
            queryset = method(self, *args, **kwargs)
            
            # 将QuerySet转换为列表进行缓存
            if hasattr(queryset, 'all'):
                data = list(queryset.all())
            else:
                data = queryset
            
            # 设置缓存
            cache_ttl = ttl or 300  # 默认5分钟
            DatabaseQueryCacheManager.set_cached_queryset(
                model_name=model_name,
                queryset_data=data,
                query_params=query_params,
                user_id=user_id,
                timeout=cache_ttl
            )
            
            return queryset
        
        return wrapper
    return decorator

def throttle_requests(
    requests_per_minute: int = 60,
    requests_per_hour: int = 1000,
    scope: str = 'default'
):
    """
    请求频率限制装饰器
    
    Args:
        requests_per_minute: 每分钟请求数限制
        requests_per_hour: 每小时请求数限制
        scope: 限制作用域
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 获取客户端标识
            if request.user.is_authenticated:
                client_id = f"user:{request.user.id}"
            else:
                client_id = f"ip:{request.META.get('REMOTE_ADDR', 'unknown')}"
            
            # 构建缓存键
            minute_key = f"throttle:{scope}:minute:{client_id}:{int(time.time() // 60)}"
            hour_key = f"throttle:{scope}:hour:{client_id}:{int(time.time() // 3600)}"
            
            # 检查分钟限制
            minute_count = cache.get(minute_key, 0)
            if minute_count >= requests_per_minute:
                return Response({
                    'error': '请求过于频繁',
                    'message': f'每分钟最多允许 {requests_per_minute} 个请求',
                    'retry_after': 60 - (int(time.time()) % 60)
                }, status=429)
            
            # 检查小时限制
            hour_count = cache.get(hour_key, 0)
            if hour_count >= requests_per_hour:
                return Response({
                    'error': '请求过于频繁',
                    'message': f'每小时最多允许 {requests_per_hour} 个请求',
                    'retry_after': 3600 - (int(time.time()) % 3600)
                }, status=429)
            
            # 增加计数
            cache.set(minute_key, minute_count + 1, 60)
            cache.set(hour_key, hour_count + 1, 3600)
            
            # 执行原始视图
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator

def invalidate_cache_on_change(
    cache_patterns: list = None,
    user_specific: bool = True
):
    """
    在数据变更时自动清除相关缓存的装饰器
    
    Args:
        cache_patterns: 需要清除的缓存模式列表
        user_specific: 是否按用户清除缓存
    """
    def decorator(method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            # 执行原始方法
            result = method(self, *args, **kwargs)
            
            # 清除相关缓存
            if cache_patterns:
                from .cache import CacheManager
                
                # 获取用户ID
                user_id = None
                if user_specific and hasattr(self, 'request'):
                    user_id = getattr(self.request.user, 'id', None)
                
                for pattern in cache_patterns:
                    if user_id and '{user_id}' in pattern:
                        pattern = pattern.format(user_id=user_id)
                    
                    CacheManager.delete_pattern(pattern)
            
            return result
        
        return wrapper
    return decorator