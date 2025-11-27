# 个人管理应用 - 完整部署与使用指南

## 📋 项目概述

这是一个功能完整的个人管理应用，集成了任务管理、时间管理、知识管理和生活事务管理等核心功能。采用前后端分离架构，前端使用 Vue.js 3.x + Element Plus，后端使用 Django 4.x + DRF。

## 🎯 核心功能模块

### 1. 用户认证系统
- 用户注册/登录
- JWT Token 认证
- 个人资料管理
- 权限控制

### 2. 任务与项目管理
- 任务创建、编辑、删除
- 拖拽式看板视图
- 任务状态管理
- 项目统计

### 3. 时间管理中心
- 日历视图（月/周/日）
- 事件管理
- 番茄钟计时器
- 时间统计

### 4. 内容与知识管理
- 笔记编辑器（富文本 + Markdown）
- 文件上传管理
- OCR 文字识别
- 版本历史

### 5. 生活事务管理
- 快递跟踪
- 习惯打卡
- 财务记录
- 健康管理

## 🛠 技术栈

### 前端
- **框架**: Vue.js 3.x + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **构建工具**: Vite
- **样式**: SCSS + Glassmorphism 设计

### 后端
- **框架**: Django 4.x + Django REST Framework
- **数据库**: PostgreSQL + Redis
- **认证**: JWT
- **API文档**: drf-spectacular (Swagger)
- **文件处理**: Pillow

### 部署
- **容器化**: Docker + docker-compose
- **Web服务器**: Nginx (生产环境)
- **反向代理**: Nginx

## 🚀 快速启动

### 方式一：Docker Compose（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd personal_app
```

2. **启动服务**
```bash
# Windows
start.bat

# Linux/macOS
./start.sh
```

3. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/api/docs/
- 数据库: localhost:5432
- Redis: localhost:6379

### 方式二：本地开发

#### 后端启动

1. **创建虚拟环境**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
# 创建 .env 文件
echo "SECRET_KEY=your-secret-key-here" > .env
echo "DEBUG=True" >> .env
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personal_app" >> .env
echo "REDIS_URL=redis://localhost:6379/0" >> .env
```

4. **数据库迁移**
```bash
python manage.py migrate
```

5. **创建超级用户**
```bash
python manage.py createsuperuser
```

6. **启动开发服务器**
```bash
python manage.py runserver
```

#### 前端启动

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **配置环境变量**
```bash
# 创建 .env.development 文件
echo "VITE_API_URL=http://localhost:8000/api" > .env.development
```

3. **启动开发服务器**
```bash
npm run dev
```

## 📁 项目结构

```
personal_app/
├── frontend/                 # Vue.js 前端
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 公共组件
│   │   ├── views/           # 页面组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式文件
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Django 后端
│   ├── apps/               # 应用模块
│   │   ├── users/          # 用户管理
│   │   ├── tasks/          # 任务管理
│   │   ├── time_management/ # 时间管理
│   │   ├── knowledge/      # 知识管理
│   │   ├── life_management/ # 生活管理
│   │   └── ocr/           # OCR 服务
│   ├── config/             # 项目配置
│   ├── requirements.txt
│   └── manage.py
├── docker-compose.yml       # Docker 编排
├── start.bat               # Windows 启动脚本
├── start.sh               # Linux/macOS 启动脚本
└── README.md              # 项目说明
```

## 🔧 配置说明

### 环境变量

#### 后端环境变量 (.env)
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True/False
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://host:port/0
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

#### 前端环境变量 (.env.development)
```bash
VITE_API_URL=http://localhost:8000/api
```

### 数据库配置

项目默认使用 PostgreSQL，也支持 SQLite：

**PostgreSQL（生产推荐）:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personal_app
```

**SQLite（开发测试）:**
```bash
DATABASE_URL=sqlite:///db.sqlite3
```

## 📊 API 文档

启动后端服务后，可以通过以下地址访问 API 文档：

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### 主要 API 端点

- **认证**: `/api/auth/`
- **任务管理**: `/api/tasks/`
- **时间管理**: `/api/time/`
- **知识管理**: `/api/knowledge/`
- **生活管理**: `/api/life/`
- **OCR服务**: `/api/ocr/`

## 🎨 设计系统

### 主题色彩
- **主色调**: 蓝紫渐变 (#667eea → #764ba2)
- **背景色**: 半透明玻璃效果
- **文字色**: 白色/深灰（根据背景自适应）

### Glassmorphism 设计
```scss
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

## 🔒 安全配置

### 生产环境安全清单

1. **设置强密钥**
```bash
SECRET_KEY=your-very-long-and-random-secret-key
```

2. **禁用调试模式**
```bash
DEBUG=False
```

3. **配置允许的主机**
```bash
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

4. **HTTPS 配置**
```bash
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
```

5. **CORS 配置**
```bash
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## 📈 性能优化

### 前端优化
- 路由懒加载
- 组件按需导入
- 图片懒加载
- 缓存策略

### 后端优化
- Redis 缓存
- 数据库查询优化
- API 分页
- 文件压缩

## 🧪 测试

### 运行测试

```bash
# 后端测试
cd backend
python manage.py test

# 前端测试
cd frontend
npm run test
```

### 测试覆盖率

```bash
# 后端覆盖率
cd backend
coverage run --source='.' manage.py test
coverage report
```

## 🚀 生产部署

### Nginx 配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 媒体文件
    location /media/ {
        alias /path/to/backend/media/;
    }
}
```

### Docker 生产部署

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: personal_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/personal_app
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
```

## 🐛 常见问题

### 1. 数据库连接失败
- 检查数据库服务是否启动
- 验证连接字符串是否正确
- 确认防火墙设置

### 2. 前端无法访问后端API
- 检查CORS配置
- 验证API地址是否正确
- 确认后端服务是否启动

### 3. 文件上传失败
- 检查文件大小限制
- 验证存储路径权限
- 确认文件格式支持

### 4. OCR 识别失败
- 检查图片质量
- 验证文件格式
- 确认OCR服务配置

## 📝 开发规范

### 代码风格
- **前端**: ESLint + Prettier
- **后端**: PEP 8 + Black

### 提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目地址: [GitHub URL]

---

## 🎉 开始使用

现在您可以开始使用这个功能完整的个人管理应用了！按照上述步骤启动服务，然后在浏览器中访问 http://localhost:3000 开始体验。

祝您使用愉快！ 🚀