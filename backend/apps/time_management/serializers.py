from rest_framework import serializers
from .models import Calendar, Event, TimeRecord, PomodoroSession, EfficiencyRecord


class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = '__all__'
        read_only_fields = ('id', 'creator', 'created_at')


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ('id', 'creator', 'created_at', 'updated_at')


class TimeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeRecord
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'duration_minutes')


class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')


class EfficiencyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = EfficiencyRecord
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'efficiency_score')