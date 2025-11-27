from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import Http404
from django.core.exceptions import PermissionDenied, ValidationError
import logging
import traceback
import time
from typing import Any, Dict, Optional, Type

logger = logging.getLogger(__name__)

class CustomAPIException(Exception):
    """自定义API异常基类"""
    
    def __init__(
        self,
        message: str,
        code: str = 'UNKNOWN_ERROR',
        status_code: int = status.HTTP_400_BAD_REQUEST,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.extra_data = extra_data or {}
        super().__init__(message)

class ValidationException(CustomAPIException):
    """验证错误异常"""
    
    def __init__(self, message: str, field_errors: Optional[Dict] = None):
        super().__init__(
            message=message,
            code='VALIDATION_ERROR',
            status_code=status.HTTP_400_BAD_REQUEST,
            extra_data={'field_errors': field_errors or {}}
        )

class AuthenticationException(CustomAPIException):
    """认证错误异常"""
    
    def __init__(self, message: str = '认证失败'):
        super().__init__(
            message=message,
            code='AUTHENTICATION_ERROR',
            status_code=status.HTTP_401_UNAUTHORIZED
        )

class AuthorizationException(CustomAPIException):
    """权限错误异常"""
    
    def __init__(self, message: str = '权限不足'):
        super().__init__(
            message=message,
            code='AUTHORIZATION_ERROR',
            status_code=status.HTTP_403_FORBIDDEN
        )

class NotFoundError(CustomAPIException):
    """资源不存在错误"""
    
    def __init__(self, message: str = '请求的资源不存在'):
        super().__init__(
            message=message,
            code='NOT_FOUND',
            status_code=status.HTTP_404_NOT_FOUND
        )

class ConflictError(CustomAPIException):
    """冲突错误"""
    
    def __init__(self, message: str = '资源冲突'):
        super().__init__(
            message=message,
            code='CONFLICT',
            status_code=status.HTTP_409_CONFLICT
        )

class RateLimitExceededError(CustomAPIException):
    """频率限制错误"""
    
    def __init__(self, message: str = '请求过于频繁，请稍后再试'):
        super().__init__(
            message=message,
            code='RATE_LIMIT_EXCEEDED',
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )

class ServiceUnavailableError(CustomAPIException):
    """服务不可用错误"""
    
    def __init__(self, message: str = '服务暂时不可用'):
        super().__init__(
            message=message,
            code='SERVICE_UNAVAILABLE',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

class BusinessLogicError(CustomAPIException):
    """业务逻辑错误"""
    
    def __init__(self, message: str, code: str = 'BUSINESS_ERROR'):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_400_BAD_REQUEST
        )

class ThirdPartyAPIError(CustomAPIException):
    """第三方API错误"""
    
    def __init__(
        self, 
        message: str, 
        service_name: str, 
        api_response: Optional[Dict] = None
    ):
        super().__init__(
            message=f'{service_name} API错误: {message}',
            code='THIRD_PARTY_API_ERROR',
            status_code=status.HTTP_502_BAD_GATEWAY,
            extra_data={
                'service_name': service_name,
                'api_response': api_response
            }
        )

def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Response:
    """
    自定义异常处理器
    
    Args:
        exc: 异常实例
        context: 上下文信息
    
    Returns:
        Response: 标准化的错误响应
    """
    
    # 记录错误信息
    error_id = int(time.time() * 1000000)  # 生成唯一错误ID
    
    # 获取请求信息
    request = context.get('request')
    request_info = {}
    
    if request:
        request_info = {
            'method': request.method,
            'path': request.path,
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            'ip_address': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
    
    # 构建基础错误响应
    error_response = {
        'error_id': error_id,
        'timestamp': time.time(),
        'code': 'UNKNOWN_ERROR',
        'message': '服务器内部错误',
        'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
        'details': {},
        'request_info': request_info
    }
    
    # 处理自定义异常
    if isinstance(exc, CustomAPIException):
        error_response.update({
            'code': exc.code,
            'message': exc.message,
            'status_code': exc.status_code,
            'details': exc.extra_data
        })
        
        logger.warning(
            f"Custom API Error [{error_id}]: {exc.code} - {exc.message}",
            extra={
                'error_id': error_id,
                'code': exc.code,
                'message': exc.message,
                'extra_data': exc.extra_data,
                'request_info': request_info
            }
        )
    
    # 处理Django内置异常
    elif isinstance(exc, Http404):
        error_response.update({
            'code': 'NOT_FOUND',
            'message': '请求的资源不存在',
            'status_code': status.HTTP_404_NOT_FOUND
        })
        
    elif isinstance(exc, PermissionDenied):
        error_response.update({
            'code': 'PERMISSION_DENIED',
            'message': '权限不足',
            'status_code': status.HTTP_403_FORBIDDEN
        })
        
    elif isinstance(exc, ValidationError):
        error_response.update({
            'code': 'VALIDATION_ERROR',
            'message': '数据验证失败',
            'status_code': status.HTTP_400_BAD_REQUEST,
            'details': {'validation_errors': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)}
        })
    
    # 处理DRF内置异常
    else:
        # 尝试使用DRF默认异常处理器
        drf_response = exception_handler(exc, context)
        
        if drf_response is not None:
            error_response.update({
                'code': get_drf_error_code(exc),
                'message': get_drf_error_message(exc),
                'status_code': drf_response.status_code,
                'details': drf_response.data if isinstance(drf_response.data, dict) else {}
            })
        else:
            # 未处理的异常
            error_response['details'] = {
                'exception_type': exc.__class__.__name__,
                'exception_message': str(exc)
            }
            
            # 开发环境显示详细错误信息
            if settings.DEBUG:
                error_response['details'].update({
                    'traceback': traceback.format_exc(),
                    'context': context
                })
            
            logger.error(
                f"Unhandled Exception [{error_id}]: {exc.__class__.__name__} - {str(exc)}",
                exc_info=True,
                extra={
                    'error_id': error_id,
                    'exception_type': exc.__class__.__name__,
                    'request_info': request_info
                }
            )
    
    # 移除敏感信息
    sanitize_error_response(error_response)
    
    return Response(
        error_response,
        status=error_response['status_code'],
        headers={
            'X-Error-ID': str(error_id),
            'X-Error-Code': error_response['code']
        }
    )

def get_client_ip(request) -> str:
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip

def get_drf_error_code(exc: Exception) -> str:
    """获取DRF错误代码"""
    from rest_framework.exceptions import (
        AuthenticationFailed, PermissionDenied, NotAuthenticated,
        NotFound, MethodNotAllowed, NotAcceptable, UnsupportedMediaType,
        Throttled, ParseError, ValidationError
    )
    
    error_mapping = {
        AuthenticationFailed: 'AUTHENTICATION_FAILED',
        NotAuthenticated: 'NOT_AUTHENTICATED',
        PermissionDenied: 'PERMISSION_DENIED',
        NotFound: 'NOT_FOUND',
        MethodNotAllowed: 'METHOD_NOT_ALLOWED',
        NotAcceptable: 'NOT_ACCEPTABLE',
        UnsupportedMediaType: 'UNSUPPORTED_MEDIA_TYPE',
        Throttled: 'THROTTLED',
        ParseError: 'PARSE_ERROR',
        ValidationError: 'VALIDATION_ERROR'
    }
    
    for exc_type, code in error_mapping.items():
        if isinstance(exc, exc_type):
            return code
    
    return 'DRF_ERROR'

def get_drf_error_message(exc: Exception) -> str:
    """获取DRF错误消息"""
    if hasattr(exc, 'detail'):
        detail = exc.detail
        if isinstance(detail, dict):
            # 处理字段验证错误
            messages = []
            for field, errors in detail.items():
                if isinstance(errors, list):
                    messages.append(f"{field}: {'; '.join(str(error) for error in errors)}")
                else:
                    messages.append(f"{field}: {str(errors)}")
            return '; '.join(messages)
        elif isinstance(detail, list):
            return '; '.join(str(error) for error in detail)
        else:
            return str(detail)
    
    return str(exc)

def sanitize_error_response(response: Dict[str, Any]) -> None:
    """清理错误响应中的敏感信息"""
    sensitive_fields = [
        'password', 'token', 'secret', 'key', 'authorization',
        'csrf', 'session', 'cookie'
    ]
    
    # 递归清理敏感信息
    def sanitize_dict(data: Any) -> Any:
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                key_lower = key.lower()
                if any(sensitive in key_lower for sensitive in sensitive_fields):
                    sanitized[key] = '[REDACTED]'
                else:
                    sanitized[key] = sanitize_dict(value)
            return sanitized
        elif isinstance(data, list):
            return [sanitize_dict(item) for item in data]
        else:
            return data
    
    # 清理details字段
    if 'details' in response:
        response['details'] = sanitize_dict(response['details'])
    
    # 清理request_info字段
    if 'request_info' in response:
        request_info = response['request_info']
        if 'user_agent' in request_info:
            # 只保留浏览器信息，隐藏详细版本信息
            user_agent = request_info['user_agent']
            if 'Mozilla' in user_agent:
                request_info['user_agent'] = 'Mozilla Compatible Browser'
            else:
                request_info['user_agent'] = '[REDACTED]'

class ErrorReportingMiddleware:
    """错误报告中间件"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # 检查响应头中的错误信息
        error_id = response.get('X-Error-ID')
        error_code = response.get('X-Error-Code')
        
        if error_id and error_code:
            # 记录错误报告
            self.report_error(error_id, error_code, request, response)
        
        return response
    
    def report_error(
        self, 
        error_id: str, 
        error_code: str, 
        request, 
        response
    ):
        """报告错误到外部服务"""
        try:
            # 这里可以集成错误监控服务，如Sentry
            report_data = {
                'error_id': error_id,
                'error_code': error_code,
                'status_code': response.status_code,
                'timestamp': time.time(),
                'request': {
                    'method': request.method,
                    'path': request.path,
                    'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
                    'ip_address': get_client_ip(request)
                }
            }
            
            # 发送到错误监控服务
            logger.info(f"Error reported: {report_data}")
            
        except Exception as e:
            # 错误报告失败不应该影响正常流程
            logger.error(f"Failed to report error {error_id}: {str(e)}")

# 异常统计装饰器
def exception_statistics(func):
    """异常统计装饰器"""
    
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            
            # 记录成功统计
            logger.info(f"Function {func.__name__} executed successfully in {time.time() - start_time:.2f}s")
            
            return result
            
        except Exception as e:
            # 记录异常统计
            execution_time = time.time() - start_time
            logger.error(
                f"Function {func.__name__} raised {type(e).__name__} after {execution_time:.2f}s: {str(e)}",
                exc_info=True,
                extra={
                    'function_name': func.__name__,
                    'exception_type': type(e).__name__,
                    'execution_time': execution_time
                }
            )
            
            raise
    
    return wrapper