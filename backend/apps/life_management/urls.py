from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'packages', views.PackageTrackingViewSet, basename='package')
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'habits', views.HabitViewSet, basename='habit')
router.register(r'meals', views.MealRecordViewSet, basename='meal')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'budgets', views.BudgetViewSet, basename='budget')

urlpatterns = [
    path('', include(router.urls)),
]