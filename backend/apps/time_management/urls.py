from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'calendars', views.CalendarViewSet, basename='calendar')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'time-records', views.TimeRecordViewSet, basename='timerecord')
router.register(r'pomodoro', views.PomodoroViewSet, basename='pomodoro')
router.register(r'efficiency', views.EfficiencyViewSet, basename='efficiency')

urlpatterns = [
    path('', include(router.urls)),
]