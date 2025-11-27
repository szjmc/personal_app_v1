#!/usr/bin/env python3
"""
个人管理应用 - 健康检查脚本
检查所有服务的运行状态和配置
"""

import os
import sys
import subprocess
import urllib.request
import urllib.error
import json
from datetime import datetime

# 颜色定义
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    """打印标题"""
    print(f"{Colors.BLUE}{'='*50}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}  个人管理应用 - 健康检查{Colors.END}")
    print(f"{Colors.BLUE}{'='*50}{Colors.END}")
    print()

def print_success(message):
    """打印成功信息"""
    print(f"{Colors.GREEN}✓{Colors.END} {message}")

def print_error(message):
    """打印错误信息"""
    print(f"{Colors.RED}✗{Colors.END} {message}")

def print_warning(message):
    """打印警告信息"""
    print(f"{Colors.YELLOW}⚠{Colors.END} {message}")

def print_info(message):
    """打印信息"""
    print(f"{Colors.BLUE}ℹ{Colors.END} {message}")

def check_command(command, name):
    """检查命令是否存在"""
    try:
        subprocess.run(['which' if os.name != 'nt' else 'where', command], 
                      check=True, capture_output=True)
        print_success(f"{name} 已安装")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error(f"{name} 未找到")
        return False

def check_service(url, name):
    """检查服务是否可访问"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            if status_code == 200:
                print_success(f"{name} 运行正常 ({status_code})")
                return True
            else:
                print_warning(f"{name} 响应异常 ({status_code})")
                return False
    except urllib.error.URLError:
        print_error(f"{name} 连接失败")
        return False
    except Exception as e:
        print_error(f"{name} 检查失败: {e}")
        return False

def check_file_exists(filepath, name):
    """检查文件是否存在"""
    if os.path.exists(filepath):
        print_success(f"{name} 存在")
        return True
    else:
        print_error(f"{name} 不存在: {filepath}")
        return False

def check_docker():
    """检查 Docker 环境"""
    print_info("检查 Docker 环境...")
    
    docker_ok = True
    
    # 检查 Docker 命令
    if not check_command('docker', 'Docker'):
        docker_ok = False
    
    # 检查 docker-compose 命令
    if not check_command('docker-compose', 'Docker Compose'):
        docker_ok = False
    
    # 检查 Docker 是否运行
    if docker_ok:
        try:
            subprocess.run(['docker', 'info'], check=True, capture_output=True)
            print_success("Docker 服务运行中")
        except subprocess.CalledProcessError:
            print_error("Docker 服务未运行")
            docker_ok = False
    
    return docker_ok

def check_backend():
    """检查后端环境"""
    print_info("检查后端环境...")
    
    backend_ok = True
    
    # 检查 Python
    if not check_command('python3', 'Python 3'):
        backend_ok = False
    
    # 检查虚拟环境
    venv_path = 'backend/venv'
    if os.path.exists(venv_path):
        print_success("Python 虚拟环境存在")
    else:
        print_warning("Python 虚拟环境不存在，将在首次运行时创建")
    
    # 检查依赖文件
    if check_file_exists('backend/requirements.txt', '后端依赖文件'):
        # 检查关键依赖
        try:
            with open('backend/requirements.txt', 'r') as f:
                deps = f.read().strip().split('\n')
                key_deps = ['django', 'djangorestframework', 'psycopg2-binary']
                for dep in key_deps:
                    if any(dep in d for d in deps):
                        print_success(f"依赖包配置包含 {dep}")
        except Exception as e:
            print_warning(f"读取依赖文件失败: {e}")
    
    # 检查 Django 配置
    if check_file_exists('backend/config/settings.py', 'Django 配置文件'):
        print_success("Django 配置文件存在")
    
    return backend_ok

def check_frontend():
    """检查前端环境"""
    print_info("检查前端环境...")
    
    frontend_ok = True
    
    # 检查 Node.js
    if not check_command('node', 'Node.js'):
        frontend_ok = False
    
    # 检查 npm
    if not check_command('npm', 'NPM'):
        frontend_ok = False
    
    # 检查依赖文件
    if check_file_exists('frontend/package.json', '前端依赖文件'):
        try:
            import json
            with open('frontend/package.json', 'r') as f:
                package_data = json.load(f)
                print_success(f"前端项目: {package_data.get('name', 'Unknown')}")
                print_success(f"版本: {package_data.get('version', 'Unknown')}")
        except Exception as e:
            print_warning(f"读取 package.json 失败: {e}")
    
    # 检查 Vue 配置
    if check_file_exists('frontend/vite.config.ts', 'Vite 配置文件'):
        print_success("Vite 配置文件存在")
    
    return frontend_ok

def check_services():
    """检查服务状态"""
    print_info("检查服务状态...")
    
    services_ok = True
    
    # 检查后端服务
    if not check_service('http://localhost:8000', '后端 API'):
        services_ok = False
    
    # 检查前端服务
    if not check_service('http://localhost:3000', '前端应用'):
        services_ok = False
    
    # 检查 API 文档
    if check_service('http://localhost:8000/api/docs/', 'API 文档'):
        print_success("API 文档可访问")
    
    # 检查数据库（通过后端API）
    try:
        req = urllib.request.Request('http://localhost:8000/api/auth/me/')
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            if status_code in [200, 401]:  # 401也表示后端正常，只是未认证
                print_success("数据库连接正常")
            else:
                print_warning("数据库连接可能有问题")
    except urllib.error.URLError:
        print_error("无法检查数据库状态")
        services_ok = False
    except Exception as e:
        print_error(f"数据库检查失败: {e}")
        services_ok = False
    
    return services_ok

def check_project_structure():
    """检查项目结构"""
    print_info("检查项目结构...")
    
    structure_ok = True
    
    # 检查主要目录
    dirs_to_check = [
        ('backend', '后端目录'),
        ('frontend', '前端目录'),
        ('backend/apps', '后端应用目录'),
        ('frontend/src', '前端源码目录'),
        ('frontend/src/api', '前端API目录'),
        ('frontend/src/views', '前端视图目录'),
    ]
    
    for dir_path, dir_name in dirs_to_check:
        if os.path.exists(dir_path):
            print_success(f"{dir_name} 存在")
        else:
            print_error(f"{dir_name} 不存在")
            structure_ok = False
    
    # 检查关键文件
    files_to_check = [
        ('docker-compose.yml', 'Docker 编排文件'),
        ('README.md', '项目说明文档'),
        ('DEPLOYMENT.md', '部署文档'),
        ('start.bat', 'Windows 启动脚本'),
        ('start.sh', 'Linux/macOS 启动脚本'),
    ]
    
    for file_path, file_name in files_to_check:
        if not check_file_exists(file_path, file_name):
            structure_ok = False
    
    return structure_ok

def generate_report():
    """生成检查报告"""
    print()
    print(f"{Colors.BLUE}{'='*50}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}  检查报告${Colors.END}")
    print(f"{Colors.BLUE}{'='*50}{Colors.END}")
    print()
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"检查时间: {timestamp}")
    print(f"操作系统: {os.name}")
    print(f"工作目录: {os.getcwd()}")
    print()
    
    # 提供启动建议
    print(f"{Colors.YELLOW}{Colors.BOLD}启动建议:${Colors.END}")
    print("1. 如果所有检查都通过，运行以下命令启动应用:")
    print("   Windows: start.bat")
    print("   Linux/macOS: ./start.sh")
    print()
    print("2. 如果检查发现问题，请参考以下解决方案:")
    print("   - Python/Node.js 未安装: 请先安装相应的运行环境")
    print("   - 虚拟环境不存在: 运行启动脚本时会自动创建")
    print("   - 服务无法访问: 请检查防火墙设置或端口是否被占用")
    print()
    print("3. 更多帮助请查看: DEPLOYMENT.md")

def main():
    """主函数"""
    print_header()
    
    # 切换到项目根目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # 执行各项检查
    docker_ok = check_docker()
    print()
    
    backend_ok = check_backend()
    print()
    
    frontend_ok = check_frontend()
    print()
    
    structure_ok = check_project_structure()
    print()
    
    # 只有在项目结构正确时才检查服务
    if structure_ok:
        services_ok = check_services()
        print()
    else:
        print_warning("项目结构检查失败，跳过服务状态检查")
        services_ok = False
    
    # 生成报告
    generate_report()
    
    # 返回总体状态
    all_checks_passed = backend_ok and frontend_ok and structure_ok
    
    if all_checks_passed:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ 所有检查通过，可以启动应用！{Colors.END}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ 检查发现问题，请根据上述信息修复后再启动{Colors.END}")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}检查被用户中断{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.RED}检查过程中发生错误: {e}{Colors.END}")
        sys.exit(1)