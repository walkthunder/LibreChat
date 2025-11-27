#!/bin/bash
# LibreChat 远程部署脚本 - 在服务器上执行

set -e  # 遇到错误时退出

# 颜色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_step() {
    echo ""
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}======================================${NC}"
}

print_step "LibreChat 服务器端部署开始"

# 从环境变量获取配置（由 local-deploy.sh 传入）
IMAGE_TAR=${IMAGE_TAR:-"librechat-api-latest.tar"}
IMAGE_NAME=${IMAGE_NAME:-"librechat-api:latest"}

print_info "镜像文件: $IMAGE_TAR"
print_info "镜像名称: $IMAGE_NAME"

# 检查镜像文件是否存在
if [ ! -f "$IMAGE_TAR" ]; then
    print_error "镜像文件不存在: $IMAGE_TAR"
    exit 1
fi
print_success "镜像文件检查通过"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi
print_success "Docker 已安装"

# 检查 Docker Compose 是否安装
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi
print_success "Docker Compose 已安装"

# 加载 Docker 镜像
print_step "步骤 1/5: 加载 Docker 镜像"
print_info "正在加载镜像，请稍候..."

docker load < "$IMAGE_TAR"

if [ $? -eq 0 ]; then
    print_success "镜像加载成功"
else
    print_error "镜像加载失败"
    exit 1
fi

# 验证镜像
print_step "步骤 2/5: 验证镜像"
if docker images | grep -q "librechat-api"; then
    print_success "镜像验证通过"
    docker images | grep librechat-api
else
    print_error "镜像验证失败"
    exit 1
fi

# 停止旧服务
print_step "步骤 3/5: 停止旧服务"

if [ -f "deploy-compose.yml" ]; then
    COMPOSE_FILE="deploy-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    print_error "找不到 docker-compose 配置文件"
    exit 1
fi

print_info "使用配置文件: $COMPOSE_FILE"

# 检查是否有运行中的容器
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_info "停止现有服务..."
    docker compose -f "$COMPOSE_FILE" down
    print_success "旧服务已停止"
else
    print_info "没有运行中的服务"
fi

# 清理镜像文件
print_step "步骤 4/5: 清理临时文件"
print_info "删除镜像文件: $IMAGE_TAR"
rm -f "$IMAGE_TAR"
print_success "临时文件已清理"

# 启动新服务
print_step "步骤 5/5: 启动服务"
print_info "启动 LibreChat 服务..."

docker compose -f "$COMPOSE_FILE" up -d

if [ $? -eq 0 ]; then
    print_success "服务启动成功"
else
    print_error "服务启动失败"
    exit 1
fi

# 等待服务启动
print_info "等待服务启动..."
sleep 5

# 显示服务状态
print_step "服务状态"
docker compose -f "$COMPOSE_FILE" ps

# 检查服务健康状态
print_info "检查服务健康状态..."
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_success "服务运行正常"
else
    print_warning "部分服务可能未正常启动，请检查日志"
fi

print_step "部署完成！"
print_success "LibreChat 已成功部署"
echo ""
print_info "查看日志: docker compose -f $COMPOSE_FILE logs -f"
print_info "查看状态: docker compose -f $COMPOSE_FILE ps"
print_info "重启服务: docker compose -f $COMPOSE_FILE restart"
print_info "停止服务: docker compose -f $COMPOSE_FILE down"
echo ""
