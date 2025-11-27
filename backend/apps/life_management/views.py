from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, timedelta
from .models import PackageTracking, Habit, HabitRecord, Transaction, Item, MealRecord, Budget
from .serializers import (
    PackageTrackingSerializer, HabitSerializer, HabitRecordSerializer,
    TransactionSerializer, ItemSerializer, MealRecordSerializer, BudgetSerializer
)
from drf_spectacular.utils import extend_schema


class PackageTrackingViewSet(viewsets.ModelViewSet):
    """快递管理视图集"""
    serializer_class = PackageTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['current_status', 'courier']

    def get_queryset(self):
        return PackageTracking.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """获取物流详情"""
        try:
            express = self.get_object()
            # 模拟物流信息
            tracking_info = [
                {
                    'time': express.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'location': '发货地',
                    'status': '已发货',
                    'description': f'快件已由{express.courier}揽收'
                }
            ]
            
            # 根据状态添加更多物流信息
            if express.current_status == 'in_transit':
                tracking_info.extend([
                    {
                        'time': (express.created_at + timedelta(hours=12)).strftime('%Y-%m-%d %H:%M:%S'),
                        'location': '转运中心',
                        'status': '运输中',
                        'description': '快件到达转运中心'
                    }
                ])
            
            return Response({
                'tracking_info': tracking_info,
                'current_status': express.current_status,
                'current_location': express.current_location
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def refresh_tracking(self, request, pk=None):
        """刷新物流信息"""
        try:
            express = self.get_object()
            # 模拟刷新逻辑，实际应该调用第三方API
            # 这里简单地更新状态
            if express.current_status == 'pending':
                express.current_status = 'in_transit'
                express.current_location = '转运中心'
            elif express.current_status == 'in_transit':
                express.current_status = 'out_for_delivery'
                express.current_location = '配送站'
            elif express.current_status == 'out_for_delivery':
                express.current_status = 'delivered'
                express.current_location = '已签收'
            
            express.updated_at = timezone.now()
            express.save()
            
            serializer = self.get_serializer(express)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def search_courier(self, request):
        """搜索快递公司"""
        query = request.query_params.get('query', '')
        couriers = ['顺丰速运', '圆通速递', '中通快递', '韵达速递', '申通快递']
        
        if query:
            couriers = [c for c in couriers if query in c]
        
        return Response(couriers)


class HabitViewSet(viewsets.ModelViewSet):
    """习惯管理视图集"""
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):
        """获取习惯记录"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        records = HabitRecord.objects.filter(habit_id=pk, user=self.request.user)
        
        if start_date:
            records = records.filter(date__gte=start_date)
        if end_date:
            records = records.filter(date__lte=end_date)
            
        serializer = HabitRecordSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """打卡"""
        date = request.data.get('date', timezone.now().date())
        notes = request.data.get('notes', '')
        
        record, created = HabitRecord.objects.update_or_create(
            habit_id=pk,
            user=self.request.user,
            date=date,
            defaults={
                'completed': True,
                'notes': notes
            }
        )
        
        if created:
            # 计算连续天数
            self._calculate_streak_days(pk)
            return Response({'message': '打卡成功'})
        else:
            return Response({'message': '今日已打卡'})

    @action(detail=True, methods=['delete'])
    def cancel_check_in(self, request, pk=None):
        """取消打卡"""
        date = request.query_params.get('date')
        
        try:
            record = HabitRecord.objects.get(
                habit_id=pk,
                user=self.request.user,
                date=date
            )
            record.delete()
            return Response({'message': '取消打卡成功'})
        except HabitRecord.DoesNotExist:
            return Response({'error': '打卡记录不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """获取习惯统计"""
        try:
            habit = Habit.objects.get(id=pk, user=self.request.user)
            
            # 计算统计数据
            total_days = 30  # 简化处理
            completed_days = HabitRecord.objects.filter(
                habit=habit,
                completed=True
            ).count()
            
            streak_days = self._calculate_streak_days(pk)
            
            # 本周记录
            today = timezone.now().date()
            week_start = today - timedelta(days=today.weekday())
            this_week_records = []
            
            for i in range(7):
                date = week_start + timedelta(days=i)
                record = HabitRecord.objects.filter(
                    habit=habit,
                    date=date,
                    completed=True
                ).first()
                this_week_records.append({
                    'date': date.isoformat(),
                    'completed': bool(record)
                })
            
            stats = {
                'total_days': total_days,
                'completed_days': completed_days,
                'streak_days': streak_days,
                'completion_rate': round((completed_days / total_days) * 100, 1) if total_days > 0 else 0,
                'this_week_records': this_week_records
            }
            
            return Response(stats)
        except Habit.DoesNotExist:
            return Response({'error': '习惯不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def today_status(self, request):
        """获取今日打卡状态"""
        today = timezone.now().date()
        
        habits = Habit.objects.filter(user=self.request.user, is_active=True)
        records = []
        
        for habit in habits:
            record = HabitRecord.objects.filter(
                habit=habit,
                date=today,
                completed=True
            ).first()
            
            records.append({
                'habit_id': habit.id,
                'completed': bool(record),
                'notes': record.notes if record else ''
            })
        
        return Response({'records': records})

    def _calculate_streak_days(self, habit_id):
        """计算连续打卡天数"""
        records = HabitRecord.objects.filter(
            habit_id=habit_id,
            completed=True
        ).order_by('-date')
        
        if not records:
            return 0
        
        streak = 0
        current_date = timezone.now().date()
        
        for record in records:
            if record.date == current_date - timedelta(days=streak):
                streak += 1
            else:
                break
        
        return streak


class TransactionViewSet(viewsets.ModelViewSet):
    """交易记录视图集"""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'category']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """获取财务汇总"""
        user = self.request.user
        period = request.query_params.get('period', 'month')
        
        # 计算日期范围
        today = timezone.now().date()
        if period == 'month':
            start_date = today.replace(day=1)
        elif period == 'year':
            start_date = today.replace(month=1, day=1)
        else:
            # 自定义日期范围
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
        
        # 计算汇总数据
        transactions = Transaction.objects.filter(user=user)
        
        if start_date:
            transactions = transactions.filter(date__gte=start_date)
        if end_date:
            transactions = transactions.filter(date__lte=end_date)
        
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expense = sum(t.amount for t in transactions if t.type == 'expense')
        
        # 分类统计
        categories = {}
        for t in transactions:
            if t.type == 'expense':
                categories[t.category] = categories.get(t.category, 0) + t.amount
        
        categories_breakdown = [
            {'category': k, 'amount': v, 'percentage': round((v / total_expense) * 100, 1) if total_expense > 0 else 0}
            for k, v in categories.items()
        ]
        
        # 每日趋势
        daily_trend = []
        for i in range(30):  # 最近30天
            date = today - timedelta(days=i)
            day_income = sum(t.amount for t in transactions if t.type == 'income' and t.date == date)
            day_expense = sum(t.amount for t in transactions if t.type == 'expense' and t.date == date)
            
            daily_trend.append({
                'date': date.isoformat(),
                'income': day_income,
                'expense': day_expense
            })
        
        summary = {
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': total_income - total_expense,
            'month_income': sum(t.amount for t in transactions if t.type == 'income' and t.date.month == today.month),
            'month_expense': sum(t.amount for t in transactions if t.type == 'expense' and t.date.month == today.month),
            'categories_breakdown': categories_breakdown,
            'daily_trend': daily_trend[::-1]  # 倒序显示
        }
        
        return Response(summary)

    @action(detail=False, methods=['post'])
    def sync_alipay(self, request):
        """同步支付宝账单"""
        # 模拟同步过程
        return Response({'message': '支付宝账单同步成功', 'imported_count': 50})

    @action(detail=False, methods=['post'])
    def sync_wechat(self, request):
        """同步微信账单"""
        # 模拟同步过程
        return Response({'message': '微信账单同步成功', 'imported_count': 35})


class ItemViewSet(viewsets.ModelViewSet):
    """物品管理视图集"""
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'location']

    def get_queryset(self):
        return Item.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """获取即将过期的物品"""
        user = self.request.user
        three_days_later = timezone.now().date() + timedelta(days=3)
        
        items = Item.objects.filter(
            user=user,
            expiry_date__lte=three_days_later,
            expiry_date__gte=timezone.now().date()
        ).order_by('expiry_date')
        
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def category_stats(self, request):
        """获取分类统计"""
        user = self.request.user
        items = Item.objects.filter(user=user)
        
        stats = {}
        for item in items:
            stats[item.category] = stats.get(item.category, 0) + item.quantity
        
        return Response(stats)





class MealRecordViewSet(viewsets.ModelViewSet):
    """饮食记录视图集"""
    serializer_class = MealRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['meal_type']

    def get_queryset(self):
        return MealRecord.objects.filter(user=self.request.user).order_by('-date', '-time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today_meals(self, request):
        """获取今日饮食记录"""
        today = timezone.now().date()
        meals = MealRecord.objects.filter(user=self.request.user, date=today)
        serializer = self.get_serializer(meals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calories_summary(self, request):
        """获取卡路里汇总"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        meals = MealRecord.objects.filter(user=self.request.user)
        
        if start_date:
            meals = meals.filter(date__gte=start_date)
        if end_date:
            meals = meals.filter(date__lte=end_date)
        
        # 按日期分组统计卡路里
        calories_by_date = {}
        for meal in meals:
            if meal.calories:
                date_str = meal.date.isoformat()
                if date_str not in calories_by_date:
                    calories_by_date[date_str] = 0
                calories_by_date[date_str] += meal.calories
        
        # 转换为列表格式
        calories_summary = [
            {'date': date, 'calories': calories}
            for date, calories in calories_by_date.items()
        ]
        
        return Response(calories_summary)


class BudgetViewSet(viewsets.ModelViewSet):
    """预算管理视图集"""
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'period']

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current_month(self, request):
        """获取当前月度预算"""
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        
        # 获取下个月的第一天
        if today.month == 12:
            end_of_month = today.replace(year=today.year+1, month=1, day=1)
        else:
            end_of_month = today.replace(month=today.month+1, day=1)
        
        budgets = Budget.objects.filter(
            user=self.request.user,
            period='monthly',
            start_date__lte=end_of_month,
            end_date__gte=start_of_month
        )
        
        serializer = self.get_serializer(budgets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """获取预算汇总"""
        budgets = Budget.objects.filter(user=self.request.user)
        
        total_budget = sum(float(budget.amount) for budget in budgets)
        total_spent = sum(float(budget.spent_amount) for budget in budgets)
        
        # 按分类统计
        category_summary = {}
        for budget in budgets:
            category = budget.category
            if category not in category_summary:
                category_summary[category] = {
                    'budget': 0,
                    'spent': 0,
                    'remaining': 0
                }
            category_summary[category]['budget'] += float(budget.amount)
            category_summary[category]['spent'] += float(budget.spent_amount)
        
        # 计算剩余金额
        for category in category_summary:
            category_summary[category]['remaining'] = (
                category_summary[category]['budget'] - category_summary[category]['spent']
            )
        
        summary = {
            'total_budget': total_budget,
            'total_spent': total_spent,
            'total_remaining': total_budget - total_spent,
            'category_summary': category_summary
        }
        
        return Response(summary)