#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出函数
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   个人管理应用 - 一键启动${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$DOCKER_COMPOSE_PID" ]; then
        docker-compose down 2>/dev/null
    fi
    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

print_header
echo

# 检查 Docker 是否可用
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}检测到 Docker，是否使用 Docker 启动？ (y/N)${NC}"
    read -r use_docker
    if [[ $use_docker =~ ^[Yy]$ ]]; then
        print_info "使用 Docker 启动应用..."
        docker-compose up --build -d
        if [ $? -eq 0 ]; then
            echo
            echo -e "${GREEN}应用启动完成！${NC}"
            echo -e "${BLUE}访问地址:${NC}"
            echo "   前端应用: http://localhost:3000"
            echo "   后端API:  http://localhost:8000"
            echo "   API文档:  http://localhost:8000/api/docs/"
            echo "   数据库:   localhost:5432"
            echo "   Redis:    localhost:6379"
            echo
            echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
            docker-compose logs -f
            DOCKER_COMPOSE_PID=$!
            wait $DOCKER_COMPOSE_PID
        else
            print_error "Docker 启动失败，切换到本地开发模式"
        fi
    fi
fi

print_info "使用本地开发模式启动..."
echo

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    print_error "未找到 Python，请先安装 Python 3.8+"
    exit 1
fi

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    print_error "未找到 Node.js，请先安装 Node.js 16+"
    exit 1
fi

print_info "[1/4] 启动后端服务..."
cd backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
    print_info "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
print_info "安装后端依赖..."
pip install -r requirements.txt -q

# 数据库迁移
print_info "执行数据库迁移..."
python manage.py migrate --noinput

# 创建超级用户（如果不存在）
print_info "检查管理员账户..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('创建默认管理员账户: admin/admin123')
else:
    print('管理员账户已存在')
"

# 启动后端服务
print_info "启动 Django 开发服务器..."
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

print_success "[2/4] 后端服务启动完成"
echo

print_info "[3/4] 启动前端服务..."
cd ../frontend

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    print_info "安装前端依赖..."
    npm install
fi

# 启动前端服务
print_info "启动 Vue 开发服务器..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

print_success "[4/4] 前端服务启动完成"
echo

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   应用启动成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo -e "${BLUE}🌐 访问地址:${NC}"
echo "   前端应用: http://localhost:3000"
echo "   后端API:  http://localhost:8000"
echo "   API文档:  http://localhost:8000/api/docs/"
echo "   管理后台: http://localhost:8000/admin/"
echo
echo -e "${BLUE}🔑 默认管理员账户:${NC}"
echo "   用户名: admin"
echo "   密码:   admin123"
echo
echo -e "${BLUE}📊 服务状态:${NC}"
echo "   数据库: PostgreSQL (localhost:5432)"
echo "   缓存:   Redis (localhost:6379)"
echo
echo -e "${BLUE}📝 日志文件:${NC}"
echo "   后端日志: backend/logs/"
echo "   前端日志: 查看浏览器控制台"
echo
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"

# 等待用户中断
wait