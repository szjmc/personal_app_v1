from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class PackageTracking(models.Model):
    """快递追踪"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_number = models.CharField(max_length=100, verbose_name='快递单号')
    courier = models.CharField(max_length=50, verbose_name='快递公司')
    description = models.CharField(max_length=200, blank=True, verbose_name='描述')
    
    # 物流状态
    current_status = models.CharField(max_length=100, verbose_name='当前状态')
    last_update = models.DateTimeField(null=True, blank=True, verbose_name='最后更新')
    is_delivered = models.BooleanField(default=False, verbose_name='是否已送达')
    has_exception = models.BooleanField(default=False, verbose_name='是否有异常')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='packages')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'package_tracking'
        verbose_name = '快递追踪'
        verbose_name_plural = '快递追踪'
        unique_together = ['tracking_number', 'creator']

    def __str__(self):
        return f"{self.courier} - {self.tracking_number}"


class PackageStatus(models.Model):
    """快递状态详情"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(PackageTracking, on_delete=models.CASCADE, related_name='status_history')
    time = models.DateTimeField(verbose_name='时间')
    location = models.CharField(max_length=200, verbose_name='地点')
    description = models.CharField(max_length=200, verbose_name='描述')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'package_status'
        verbose_name = '快递状态'
        verbose_name_plural = '快递状态'
        ordering = ['time']


class Item(models.Model):
    """物品清单"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='物品名称')
    category = models.CharField(max_length=50, verbose_name='分类')
    quantity = models.IntegerField(default=1, verbose_name='数量')
    location = models.CharField(max_length=100, blank=True, verbose_name='位置')
    
    # 过期时间
    expiry_date = models.DateField(null=True, blank=True, verbose_name='过期时间')
    is_expired = models.BooleanField(default=False, verbose_name='是否已过期')
    
    description = models.TextField(blank=True, verbose_name='描述')
    image = models.ImageField(upload_to='items/', blank=True, null=True, verbose_name='图片')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'items'
        verbose_name = '物品'
        verbose_name_plural = '物品'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.expiry_date:
            from django.utils import timezone
            self.is_expired = self.expiry_date < timezone.now().date()
        super().save(*args, **kwargs)


class Habit(models.Model):
    """习惯模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='习惯名称')
    description = models.CharField(max_length=200, blank=True, verbose_name='描述')
    target_days = models.IntegerField(default=30, verbose_name='目标天数')
    
    # 习惯设置
    reminder_enabled = models.BooleanField(default=True, verbose_name='开启提醒')
    reminder_time = models.TimeField(default='09:00', verbose_name='提醒时间')
    
    # 统计信息
    current_streak = models.IntegerField(default=0, verbose_name='当前连续天数')
    longest_streak = models.IntegerField(default=0, verbose_name='最长连续天数')
    total_days = models.IntegerField(default=0, verbose_name='总打卡天数')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'habits'
        verbose_name = '习惯'
        verbose_name_plural = '习惯'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class HabitRecord(models.Model):
    """习惯打卡记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='records')
    date = models.DateField(verbose_name='打卡日期')
    completed = models.BooleanField(default=True, verbose_name='是否完成')
    notes = models.TextField(blank=True, verbose_name='备注')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'habit_records'
        verbose_name = '习惯记录'
        verbose_name_plural = '习惯记录'
        unique_together = ['habit', 'date']
        ordering = ['-date']


class MealRecord(models.Model):
    """饮食记录"""
    MEAL_TYPES = [
        ('breakfast', '早餐'),
        ('lunch', '午餐'),
        ('dinner', '晚餐'),
        ('snack', '零食'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES, verbose_name='餐次')
    description = models.TextField(verbose_name='饮食描述')
    calories = models.IntegerField(null=True, blank=True, verbose_name='卡路里')
    
    image = models.ImageField(upload_to='meals/', blank=True, null=True, verbose_name='图片')
    notes = models.TextField(blank=True, verbose_name='备注')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_records')
    date = models.DateField(verbose_name='日期')
    time = models.TimeField(auto_now_add=True, verbose_name='时间')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meal_records'
        verbose_name = '饮食记录'
        verbose_name_plural = '饮食记录'
        ordering = ['-date', '-time']


class Transaction(models.Model):
    """财务交易记录"""
    TRANSACTION_TYPES = [
        ('income', '收入'),
        ('expense', '支出'),
    ]

    CATEGORIES = [
        ('food', '餐饮'),
        ('transport', '交通'),
        ('shopping', '购物'),
        ('entertainment', '娱乐'),
        ('health', '医疗'),
        ('education', '教育'),
        ('housing', '住房'),
        ('salary', '工资'),
        ('bonus', '奖金'),
        ('investment', '投资'),
        ('other', '其他'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='金额')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, verbose_name='类型')
    category = models.CharField(max_length=20, choices=CATEGORIES, verbose_name='分类')
    description = models.CharField(max_length=200, verbose_name='描述')
    
    # 交易时间
    date = models.DateField(verbose_name='日期')
    time = models.TimeField(null=True, blank=True, verbose_name='时间')
    
    # 预算关联
    budget_category = models.ForeignKey('Budget', on_delete=models.SET_NULL, null=True, blank=True, 
                                     related_name='transactions')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = '交易记录'
        verbose_name_plural = '交易记录'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} - {self.amount}"


class Budget(models.Model):
    """预算管理"""
    CATEGORIES = [
        ('food', '餐饮'),
        ('transport', '交通'),
        ('shopping', '购物'),
        ('entertainment', '娱乐'),
        ('health', '医疗'),
        ('education', '教育'),
        ('housing', '住房'),
        ('other', '其他'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=20, choices=CATEGORIES, verbose_name='分类')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='预算金额')
    period = models.CharField(
        max_length=20,
        choices=[
            ('monthly', '月度'),
            ('yearly', '年度'),
        ],
        default='monthly',
        verbose_name='周期'
    )
    
    # 时间范围
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    
    # 预算状态
    spent_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='已花费')
    percentage_used = models.FloatField(default=0, verbose_name='使用百分比')
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'
        verbose_name = '预算'
        verbose_name_plural = '预算'
        unique_together = ['category', 'period', 'creator']
        ordering = ['category']

    def save(self, *args, **kwargs):
        if self.amount > 0:
            self.percentage_used = float(self.spent_amount) / float(self.amount) * 100
        super().save(*args, **kwargs)