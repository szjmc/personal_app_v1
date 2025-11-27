<template>
  <el-dialog
    v-model="dialogVisible"
    :title="transaction ? '编辑交易' : '新增交易'"
    width="600px"
  >
    <el-form
      ref="transactionForm"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type" @change="handleTypeChange">
          <el-radio-button label="expense">
            <el-icon><Remove /></el-icon>
            支出
          </el-radio-button>
          <el-radio-button label="income">
            <el-icon><Plus /></el-icon>
            收入
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="金额" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :precision="2"
          :min="0.01"
          :max="999999.99"
          controls-position="right"
          class="amount-input"
          placeholder="0.00"
        >
          <template #prefix>
            <span class="currency-symbol">¥</span>
          </template>
        </el-input-number>
      </el-form-item>
      
      <el-form-item label="分类" prop="category">
        <el-cascader
          v-model="selectedCategory"
          :options="categoryOptions"
          :props="{ expandTrigger: 'hover' }"
          placeholder="选择分类"
          filterable
          @change="handleCategoryChange"
        />
      </el-form-item>
      
      <el-form-item label="账户" prop="account">
        <el-select v-model="formData.account" placeholder="选择账户" filterable allow-create>
          <el-option
            v-for="account in accountOptions"
            :key="account"
            :label="account"
            :value="account"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="时间" prop="date">
        <el-date-picker
          v-model="formData.date"
          type="datetime"
          placeholder="选择交易时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入交易描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="标签">
        <div class="tags-input">
          <el-tag
            v-for="tag in formData.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          
          <el-input
            v-if="inputVisible"
            ref="tagInput"
            v-model="inputValue"
            class="tag-input-field"
            size="small"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          
          <el-button
            v-else
            size="small"
            @click="showInput"
          >
            <el-icon><Plus /></el-icon>
            添加标签
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="凭证">
        <div class="receipt-upload">
          <el-upload
            v-model:file-list="fileList"
            class="upload-area"
            :auto-upload="false"
            :limit="1"
            :accept="'image/*,.pdf'"
            list-type="picture-card"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon class="upload-icon"><Plus /></el-icon>
          </el-upload>
          
          <div v-if="hasExistingReceipt" class="existing-receipt">
            <div class="receipt-info">
              <el-icon><Document /></el-icon>
              <span>已有凭证</span>
            </div>
            <el-button size="small" type="danger" @click="removeExistingReceipt">
              删除
            </el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>
    
    <!-- 快捷金额 -->
    <div class="quick-amounts">
      <span class="quick-label">快捷金额：</span>
      <div class="amount-buttons">
        <el-button
          v-for="amount in quickAmounts"
          :key="amount"
          size="small"
          @click="setQuickAmount(amount)"
        >
          ¥{{ amount }}
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveTransaction"
          :loading="saving"
        >
          {{ transaction ? '更新' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus, Remove, Document
} from '@element-plus/icons-vue'
import { financeApi, type Transaction, type Category } from '@/api/life'

const props = defineProps<{
  modelValue: boolean
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: any]
}>()

// 响应式数据
const saving = ref(false)
const formData = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: '',
  subcategory: '',
  account: '',
  date: '',
  description: '',
  tags: [] as string[],
  receipt_image: ''
})

const selectedCategory = ref<string[]>([])
const categoryOptions = ref<any[]>([])
const accountOptions = ref([
  '现金', '支付宝', '微信支付', '银行卡', '信用卡', 
  '花呗', '京东白条', '其他'
])

// 标签相关
const inputVisible = ref(false)
const inputValue = ref('')
const tagInput = ref<HTMLInputElement>()

// 文件上传
const fileList = ref<any[]>([])

// 快捷金额
const quickAmounts = [10, 20, 50, 100, 200, 500]

// 表单验证规则
const formRules = {
  type: [
    { required: true, message: '请选择交易类型', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  account: [
    { required: true, message: '请选择账户', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择交易时间', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasExistingReceipt = computed(() => {
  return props.transaction?.receipt_image && !fileList.value.length
})

// 方法
const loadCategories = async () => {
  try {
    const response = await financeApi.getCategories(formData.value.type)
    const categories = response.data
    
    // 转换为级联选择器格式
    categoryOptions.value = categories.map((cat: Category) => ({
      value: cat.name,
      label: cat.name,
      children: cat.subcategories.map((sub: string) => ({
        value: sub,
        label: sub
      }))
    }))
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

const handleTypeChange = (type: 'income' | 'expense') => {
  selectedCategory.value = []
  formData.value.category = ''
  formData.value.subcategory = ''
  loadCategories()
}

const handleCategoryChange = (value: string[]) => {
  if (value && value.length >= 1) {
    formData.value.category = value[0]
    formData.value.subcategory = value[1] || ''
  }
}

const setQuickAmount = (amount: number) => {
  formData.value.amount = amount
}

const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    tagInput.value?.focus()
  })
}

const handleInputConfirm = () => {
  const tag = inputValue.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const handleFileChange = (file: any) => {
  // 处理文件上传
  console.log('文件变化:', file)
}

const handleFileRemove = () => {
  formData.value.receipt_image = ''
}

const removeExistingReceipt = () => {
  formData.value.receipt_image = ''
}

const resetForm = () => {
  formData.value = {
    type: 'expense',
    amount: 0,
    category: '',
    subcategory: '',
    account: '',
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    description: '',
    tags: [],
    receipt_image: ''
  }
  selectedCategory.value = []
  fileList.value = []
}

const cancel = () => {
  dialogVisible.value = false
  resetForm()
}

const saveTransaction = async () => {
  // 基础表单验证
  if (!formData.value.amount || formData.value.amount <= 0) {
    ElMessage.error('请输入正确的金额')
    return
  }
  
  if (!formData.value.category) {
    ElMessage.error('请选择分类')
    return
  }
  
  if (!formData.value.description?.trim()) {
    ElMessage.error('请输入描述')
    return
  }
  
  saving.value = true
  try {
    // 构建提交数据
    const submitData = {
      ...formData.value,
      date: formData.value.date || new Date().toISOString()
    }
    
    // 如果有上传的文件，这里应该先上传
    if (fileList.value.length > 0) {
      // 这里应该调用文件上传API
      // submitData.receipt_image = uploadedFileUrl
    }
    
    emit('save', submitData)
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 监听弹窗打开，初始化数据
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (props.transaction) {
      // 编辑模式
      const transaction = props.transaction
      formData.value = {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        subcategory: transaction.subcategory,
        account: transaction.account,
        date: transaction.date,
        description: transaction.description,
        tags: transaction.tags || [],
        receipt_image: transaction.receipt_image || ''
      }
      
      if (transaction.category) {
        selectedCategory.value = transaction.subcategory 
          ? [transaction.category, transaction.subcategory]
          : [transaction.category]
      }
    } else {
      // 新增模式
      resetForm()
    }
    
    loadCategories()
  }
})

// 监听交易类型变化
watch(() => formData.value.type, () => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.el-form {
  .amount-input {
    width: 100%;
    
    .currency-symbol {
      color: var(--text-secondary);
      font-weight: 600;
    }
  }
  
  .tags-input {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    
    .tag-item {
      margin: 0;
    }
    
    .tag-input-field {
      width: 100px;
    }
  }
  
  .receipt-upload {
    .upload-area {
      :deep(.el-upload--picture-card) {
        .el-upload-dragger {
          border: 2px dashed var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
          
          &:hover {
            border-color: var(--primary-color);
          }
        }
      }
    }
    
    .existing-receipt {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      margin-top: 8px;
      
      .receipt-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }
  }
}

.quick-amounts {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
  padding: 16px 0;
  border-top: 1px solid var(--glass-border);
  
  .quick-label {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  
  .amount-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 级联选择器样式
:deep(.el-cascader) {
  width: 100%;
}

// 数字输入框样式
:deep(.el-input-number) {
  width: 100%;
  
  .el-input__inner {
    text-align: left;
    padding-left: 35px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .quick-amounts {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    
    .amount-buttons {
      justify-content: center;
    }
  }
  
  .tags-input {
    .tag-input-field {
      width: 80px;
    }
  }
}
</style>