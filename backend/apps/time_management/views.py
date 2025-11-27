from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Calendar, Event, TimeRecord, PomodoroSession, EfficiencyRecord
from .serializers import (
    CalendarSerializer, EventSerializer, TimeRecordSerializer,
    PomodoroSessionSerializer, EfficiencyRecordSerializer
)
from drf_spectacular.utils import extend_schema


class CalendarViewSet(viewsets.ModelViewSet):
    """日历视图集"""
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_default']

    def get_queryset(self):
        return Calendar.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class EventViewSet(viewsets.ModelViewSet):
    """日程事件视图集"""
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['calendar', 'event_type', 'is_all_day']

    def get_queryset(self):
        return Event.objects.filter(
            creator=self.request.user
        ).select_related('calendar').prefetch_related('participants')

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """获取今日事件"""
        from django.utils import timezone
        today = timezone.now().date()
        events = self.get_queryset().filter(
            start_time__date=today
        )
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)


class TimeRecordViewSet(viewsets.ModelViewSet):
    """时间记录视图集"""
    serializer_class = TimeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['task']

    def get_queryset(self):
        return TimeRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PomodoroViewSet(viewsets.ModelViewSet):
    """番茄钟视图集"""
    serializer_class = PomodoroSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EfficiencyViewSet(viewsets.ModelViewSet):
    """效率记录视图集"""
    serializer_class = EfficiencyRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date']

    def get_queryset(self):
        return EfficiencyRecord.objects.filter(user=self.request.user)