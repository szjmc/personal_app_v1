import hashlib
from typing import Any, Optional, Dict
from django.core.cache import cache
from django.conf import settings
from django.core.cache.backends.base import DEFAULT_TIMEOUT

CACHE_TTL = getattr(settings, 'CACHE_TTL', DEFAULT_TIMEOUT)

class CacheManager:
    """缓存管理器"""
    
    @staticmethod
    def get_cache_key(prefix: str, *args, **kwargs) -> str:
        """生成缓存键"""
        key_parts = [prefix]
        
        # 添加位置参数
        if args:
            key_parts.extend([str(arg) for arg in args])
        
        # 添加关键字参数（按字母顺序排序）
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            for k, v in sorted_kwargs:
                key_parts.append(f"{k}:{v}")
        
        # 对长键名进行哈希处理
        key_str = ":".join(key_parts)
        if len(key_str) > 200:
            key_str = f"{prefix}:{hashlib.md5(key_str.encode()).hexdigest()}"
        
        return key_str
    
    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        """获取缓存值"""
        try:
            value = cache.get(key, default)
            if isinstance(value, str) and value.startswith('json:'):
                return json.loads(value[5:])
            return value
        except Exception:
            return default
    
    @staticmethod
    def set(key: str, value: Any, timeout: Optional[int] = CACHE_TTL) -> bool:
        """设置缓存值"""
        try:
            if isinstance(value, (dict, list, tuple)):
                value = f"json:{json.dumps(value, ensure_ascii=False)}"
            return cache.set(key, value, timeout)
        except Exception:
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """删除缓存"""
        try:
            return cache.delete(key)
        except Exception:
            return False
    
    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """批量删除匹配模式的缓存"""
        try:
            from django.core.cache import cache
            if hasattr(cache, 'delete_pattern'):
                return cache.delete_pattern(pattern)
            else:
                # 如果缓存后端不支持模式删除，使用其他方式
                keys = cache.keys(pattern)
                if keys:
                    return cache.delete_many(keys)
                return 0
        except Exception:
            return 0
    
    @staticmethod
    def get_or_set(
        key: str, 
        default_func, 
        timeout: Optional[int] = CACHE_TTL
    ) -> Any:
        """获取或设置缓存"""
        value = CacheManager.get(key)
        if value is None:
            value = default_func()
            CacheManager.set(key, value, timeout)
        return value

class UserCacheManager(CacheManager):
    """用户相关缓存管理器"""
    
    @staticmethod
    def get_user_cache_key(user_id: int, prefix: str, *args, **kwargs) -> str:
        """生成用户相关缓存键"""
        return super().get_cache_key(f"user_{user_id}:{prefix}", *args, **kwargs)
    
    @staticmethod
    def get_user_data(user_id: int, prefix: str, *args, **kwargs) -> Any:
        """获取用户缓存数据"""
        key = UserCacheManager.get_user_cache_key(user_id, prefix, *args, **kwargs)
        return CacheManager.get(key)
    
    @staticmethod
    def set_user_data(
        user_id: int, 
        prefix: str, 
        value: Any, 
        timeout: Optional[int] = CACHE_TTL,
        *args, **kwargs
    ) -> bool:
        """设置用户缓存数据"""
        key = UserCacheManager.get_user_cache_key(user_id, prefix, *args, **kwargs)
        return CacheManager.set(key, value, timeout)
    
    @staticmethod
    def delete_user_data(user_id: int, prefix: str, *args, **kwargs) -> bool:
        """删除用户缓存数据"""
        key = UserCacheManager.get_user_cache_key(user_id, prefix, *args, **kwargs)
        return CacheManager.delete(key)
    
    @staticmethod
    def clear_user_cache(user_id: int) -> int:
        """清除用户所有缓存"""
        pattern = f"user_{user_id}:*"
        return CacheManager.delete_pattern(pattern)

class APIResponseCacheManager(CacheManager):
    """API响应缓存管理器"""
    
    @staticmethod
    def get_api_cache_key(
        endpoint: str, 
        params: Optional[Dict] = None, 
        user_id: Optional[int] = None
    ) -> str:
        """生成API缓存键"""
        cache_prefix = f"api:{endpoint}"
        
        if user_id:
            cache_prefix = f"user_{user_id}:" + cache_prefix
        
        if params:
            # 过滤掉不需要缓存的参数
            cache_params = {
                k: v for k, v in params.items() 
                if k not in ['_', 'nocache', 't']
            }
            if cache_params:
                return super().get_cache_key(cache_prefix, **cache_params)
        
        return cache_prefix
    
    @staticmethod
    def get_cached_response(
        endpoint: str, 
        params: Optional[Dict] = None, 
        user_id: Optional[int] = None
    ) -> Optional[Dict]:
        """获取缓存的API响应"""
        key = APIResponseCacheManager.get_api_cache_key(endpoint, params, user_id)
        return CacheManager.get(key)
    
    @staticmethod
    def set_cached_response(
        endpoint: str, 
        response_data: Dict, 
        params: Optional[Dict] = None, 
        user_id: Optional[int] = None,
        timeout: Optional[int] = CACHE_TTL
    ) -> bool:
        """缓存API响应"""
        key = APIResponseCacheManager.get_api_cache_key(endpoint, params, user_id)
        return CacheManager.set(key, response_data, timeout)
    
    @staticmethod
    def invalidate_endpoint_cache(endpoint: str, user_id: Optional[int] = None) -> int:
        """使指定端点的缓存失效"""
        if user_id:
            pattern = f"user_{user_id}:api:{endpoint}:*"
        else:
            pattern = f"api:{endpoint}:*"
        return CacheManager.delete_pattern(pattern)

class DatabaseQueryCacheManager(CacheManager):
    """数据库查询缓存管理器"""
    
    @staticmethod
    def get_query_cache_key(
        model_name: str, 
        query_params: Optional[Dict] = None, 
        user_id: Optional[int] = None
    ) -> str:
        """生成查询缓存键"""
        cache_prefix = f"query:{model_name}"
        
        if user_id:
            cache_prefix = f"user_{user_id}:" + cache_prefix
        
        if query_params:
            return super().get_cache_key(cache_prefix, **query_params)
        
        return cache_prefix
    
    @staticmethod
    def get_cached_queryset(
        model_name: str, 
        query_params: Optional[Dict] = None, 
        user_id: Optional[int] = None
    ) -> Optional[list]:
        """获取缓存的查询集"""
        key = DatabaseQueryCacheManager.get_query_cache_key(model_name, query_params, user_id)
        return CacheManager.get(key)
    
    @staticmethod
    def set_cached_queryset(
        model_name: str, 
        queryset_data: list, 
        query_params: Optional[Dict] = None, 
        user_id: Optional[int] = None,
        timeout: Optional[int] = CACHE_TTL
    ) -> bool:
        """缓存查询集"""
        key = DatabaseQueryCacheManager.get_query_cache_key(model_name, query_params, user_id)
        return CacheManager.set(key, queryset_data, timeout)
    
    @staticmethod
    def invalidate_model_cache(model_name: str, user_id: Optional[int] = None) -> int:
        """使指定模型的缓存失效"""
        if user_id:
            pattern = f"user_{user_id}:query:{model_name}:*"
        else:
            pattern = f"query:{model_name}:*"
        return CacheManager.delete_pattern(pattern)

# 缓存配置
CACHE_SETTINGS = {
    # API响应缓存时间（秒）
    'api_cache_ttl': {
        'default': 300,  # 5分钟
        'weather': 600,  # 10分钟
        'translation': 86400,  # 24小时
        'map_location': 3600,  # 1小时
        'user_profile': 1800,  # 30分钟
        'task_list': 60,  # 1分钟
        'kanban_board': 120,  # 2分钟
    },
    
    # 数据库查询缓存时间（秒）
    'query_cache_ttl': {
        'default': 180,  # 3分钟
        'user_tasks': 120,  # 2分钟
        'user_events': 300,  # 5分钟
        'user_notes': 600,  # 10分钟
    },
    
    # 缓存键前缀
    'cache_prefixes': {
        'api': 'api',
        'query': 'query',
        'user': 'user',
        'session': 'session',
        'settings': 'settings',
    }
}

def get_cache_ttl(category: str, default_ttl: Optional[int] = None) -> int:
    """获取缓存TTL"""
    return CACHE_SETTINGS['api_cache_ttl'].get(
        category, 
        default_ttl or CACHE_SETTINGS['api_cache_ttl']['default']
    )