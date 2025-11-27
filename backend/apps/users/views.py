from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import RetrieveUpdateAPIView
from drf_spectacular.utils import extend_schema
from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer
)


@extend_schema(tags=['认证'])
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """用户注册"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['认证'])
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """用户登录"""
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['认证'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    """用户登出"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': '登出成功'}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'error': '登出失败'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['用户信息'])
class UserProfileView(RetrieveUpdateAPIView):
    """获取和更新用户信息"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


@extend_schema(tags=['用户信息'])
class UserDetailView(RetrieveUpdateAPIView):
    """获取和更新用户详细信息"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(tags=['用户信息'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """修改密码"""
    serializer = PasswordChangeSerializer(
        data=request.data, 
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({'message': '密码修改成功'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['用户信息'])
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """获取当前用户信息"""
    return Response(UserSerializer(request.user).data)