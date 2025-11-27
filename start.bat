@echo off
title 个人管理应用启动器
color 0A

echo ========================================
echo   个人管理应用 - 一键启动
echo ========================================
echo.

:: 检查 Docker 是否运行
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo 检测到 Docker，是否使用 Docker 启动？ (Y/N)
    set /p use_docker=
    if /i "%use_docker%"=="Y" (
        echo 使用 Docker 启动应用...
        docker-compose up --build -d
        echo.
        echo 应用启动完成！
        echo 前端地址: http://localhost:3000
        echo 后端地址: http://localhost:8000
        echo API文档: http://localhost:8000/api/docs/
        echo 数据库: localhost:5432
        echo Redis: localhost:6379
        echo.
        echo 按 Ctrl+C 停止服务
        docker-compose logs -f
        pause
        exit /b
    )
)

echo 使用本地开发模式启动...
echo.

:: 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b
)

:: 检查 Node.js 环境
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js 16+
    pause
    exit /b
)

echo [1/4] 启动后端服务...
cd backend

:: 创建虚拟环境
if not exist venv (
    echo 创建 Python 虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境并安装依赖
call venv\Scripts\activate
echo 安装后端依赖...
pip install -r requirements.txt -q

:: 数据库迁移
echo 执行数据库迁移...
python manage.py migrate --noinput

:: 创建超级用户（如果不存在）
echo 检查管理员账户...
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('创建默认管理员账户: admin/admin123')
else:
    print('管理员账户已存在')
"

:: 启动后端服务
echo 启动 Django 开发服务器...
start /B python manage.py runserver 0.0.0.0:8000

:: 等待后端启动
timeout /t 3 /nobreak >nul

echo [2/4] 后端服务启动完成
echo.

echo [3/4] 启动前端服务...
cd ..\frontend

:: 安装前端依赖
if not exist node_modules (
    echo 安装前端依赖...
    npm install
)

:: 启动前端服务
echo 启动 Vue 开发服务器...
start /B npm run dev

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo [4/4] 前端服务启动完成
echo.

echo ========================================
echo   应用启动成功！
echo ========================================
echo.
echo 🌐 访问地址:
echo    前端应用: http://localhost:3000
echo    后端API:  http://localhost:8000
echo    API文档:  http://localhost:8000/api/docs/
echo    管理后台: http://localhost:8000/admin/
echo.
echo 🔑 默认管理员账户:
echo    用户名: admin
echo    密码:   admin123
echo.
echo 📊 服务状态:
echo    数据库: PostgreSQL (localhost:5432)
echo    缓存:   Redis (localhost:6379)
echo.
echo 📝 日志文件:
echo    后端日志: backend/logs/
echo    前端日志: 查看浏览器控制台
echo.
echo 按 Ctrl+C 停止所有服务，或按任意键退出...
pause >nul

:: 清理进程
echo 正在停止服务...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo 服务已停止

pause