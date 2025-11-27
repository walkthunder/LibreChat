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
print_step "步骤 2/7: 验证镜像"
if docker images | grep -q "librechat-api"; then
    print_success "镜像验证通过"
    docker images | grep librechat-api
else
    print_error "镜像验证失败"
    exit 1
fi

# 检查 Docker Compose 配置文件
print_step "步骤 3/7: 检查 Docker Compose 配置文件"

if [ -f "deploy-compose.yml" ]; then
    COMPOSE_FILE="deploy-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    print_error "找不到 docker-compose 配置文件"
    print_info "请确保 deploy-compose.yml 或 docker-compose.yml 存在"
    exit 1
fi

print_success "找到配置文件: $COMPOSE_FILE"

# 检查必需的配置文件
print_step "步骤 4/7: 检查必需的配置文件"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    print_error ".env 配置文件不存在"
    print_info "请确保 .env 文件已上传到服务器"
    exit 1
fi
print_success ".env 文件存在"

# 验证 .env 文件中的关键配置
print_info "验证 .env 配置..."
REQUIRED_VARS=("MONGO_URI" "CREDS_KEY" "CREDS_IV" "JWT_SECRET" "JWT_REFRESH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env || grep -q "^${var}=\s*$" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "以下必需的环境变量未配置或为空:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi
print_success ".env 配置验证通过"

# 检查 librechat.yaml 文件
if [ ! -f "librechat.yaml" ]; then
    print_warning "librechat.yaml 配置文件不存在，将使用默认配置"
    print_info "建议创建 librechat.yaml 以自定义应用配置"
else
    print_success "librechat.yaml 文件存在"
    
    # 验证 YAML 文件格式
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('librechat.yaml'))" 2>/dev/null; then
            print_success "librechat.yaml 格式验证通过"
        else
            print_error "librechat.yaml 格式错误，请检查 YAML 语法"
            exit 1
        fi
    fi
fi

# 检查数据目录
print_info "检查数据目录..."
REQUIRED_DIRS=("images" "uploads" "logs" "data-node" "meili_data_v1.12")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        print_info "创建目录: $dir"
        mkdir -p "$dir"
    fi
done
print_success "数据目录检查完成"

# 停止旧服务
print_step "步骤 5/7: 停止旧服务"

if [ -f "deploy-compose.yml" ]; then
    COMPOSE_FILE="deploy-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    print_error "找不到 docker-compose 配置文件"
    exit 1
fi

# 检查是否有运行中的容器
if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "Up"; then
    print_info "停止现有服务..."
    docker compose -f "$COMPOSE_FILE" down
    print_success "旧服务已停止"
else
    print_info "没有运行中的服务"
fi

# 清理镜像文件
print_step "步骤 6/7: 清理临时文件"
print_info "删除镜像文件: $IMAGE_TAR"
rm -f "$IMAGE_TAR"
print_success "临时文件已清理"

# 启动新服务
print_step "步骤 7/7: 启动服务"
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
sleep 10

# 显示服务状态
print_step "服务状态"
docker compose -f "$COMPOSE_FILE" ps

# 检查服务健康状态
print_info "检查服务健康状态..."
MAX_RETRIES=6
RETRY_COUNT=0
SERVICE_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        # 检查关键服务是否都在运行
        RUNNING_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | wc -l)
        TOTAL_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --services | wc -l)
        
        if [ "$RUNNING_SERVICES" -eq "$TOTAL_SERVICES" ]; then
            SERVICE_HEALTHY=true
            break
        fi
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        print_info "等待服务完全启动... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ "$SERVICE_HEALTHY" = true ]; then
    print_success "所有服务运行正常"
else
    print_warning "部分服务可能未正常启动，请检查日志"
    print_info "运行以下命令查看详细日志:"
    print_info "  docker compose -f $COMPOSE_FILE logs"
fi

# 显示服务访问信息
print_step "部署完成！"
print_success "LibreChat 已成功部署"
echo ""
print_info "服务信息:"
print_info "  - API 端口: 3080"
print_info "  - Web 端口: 80 (HTTP), 443 (HTTPS)"
echo ""
print_info "常用命令:"
print_info "  查看日志: docker compose -f $COMPOSE_FILE logs -f"
print_info "  查看状态: docker compose -f $COMPOSE_FILE ps"
print_info "  重启服务: docker compose -f $COMPOSE_FILE restart"
print_info "  停止服务: docker compose -f $COMPOSE_FILE down"
print_info "  查看 API 日志: docker compose -f $COMPOSE_FILE logs -f api"
echo ""
