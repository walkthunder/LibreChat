#!/bin/bash
# LibreChat 本地部署脚本 - 构建、传输、部署一体化

set -e  # 遇到错误时退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 加载配置
source "$SCRIPT_DIR/config.sh"

cd "$PROJECT_ROOT"

print_step "LibreChat 本地部署流程开始"

# 检查必要参数
if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ]; then
    print_error "请在 deploy/config.sh 中设置 SERVER_IP 和 SERVER_USER 变量"
    exit 1
fi

print_info "目标服务器: $SERVER_USER@$SERVER_IP"
print_info "部署路径: $SERVER_PATH"
print_info "镜像名称: $FULL_IMAGE_NAME"

# 检查必要工具
print_step "步骤 1/6: 检查环境"
check_command docker
check_command scp
check_command ssh
print_success "环境检查通过"

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    print_error "Docker 未运行，请先启动 Docker"
    exit 1
fi
print_success "Docker 运行正常"

# 检查配置文件
print_info "检查本地配置文件..."

if [ ! -f ".env" ]; then
    print_error ".env 文件不存在"
    print_info "请从 .env.example 复制并配置 .env 文件"
    exit 1
fi
print_success ".env 文件存在"

# 检查 Docker Compose 配置文件
if [ ! -f "deploy-compose.yml" ] && [ ! -f "docker-compose.yml" ]; then
    print_error "找不到 docker-compose 配置文件"
    print_info "请确保 deploy-compose.yml 或 docker-compose.yml 存在"
    exit 1
fi

if [ -f "deploy-compose.yml" ]; then
    print_success "deploy-compose.yml 文件存在"
else
    print_success "docker-compose.yml 文件存在"
fi

# 检查 librechat.yaml（可选但推荐）
if [ ! -f "librechat.yaml" ]; then
    print_warning "librechat.yaml 不存在，将使用默认配置"
    print_info "建议从 librechat.example.yaml 复制并配置 librechat.yaml"
else
    print_success "librechat.yaml 文件存在"
fi

print_success "配置文件检查通过"

# 构建 Docker 镜像
print_step "步骤 2/6: 构建 Docker 镜像"
print_info "使用 Dockerfile: $DOCKERFILE"
print_info "构建目标: $BUILD_TARGET"

docker build -f "$DOCKERFILE" -t "$FULL_IMAGE_NAME" --target "$BUILD_TARGET" .

if [ $? -eq 0 ]; then
    print_success "Docker 镜像构建成功"
else
    print_error "Docker 镜像构建失败"
    exit 1
fi

# 保存镜像为 tar 文件
print_step "步骤 3/6: 导出 Docker 镜像"

mkdir -p "$LOCAL_IMAGE_DIR"
IMAGE_TAR_PATH="$LOCAL_IMAGE_DIR/$IMAGE_TAR"

print_info "导出镜像到: $IMAGE_TAR_PATH"
docker save "$FULL_IMAGE_NAME" > "$IMAGE_TAR_PATH"

if [ $? -eq 0 ]; then
    IMAGE_SIZE=$(du -h "$IMAGE_TAR_PATH" | cut -f1)
    print_success "镜像已导出 (大小: $IMAGE_SIZE)"
else
    print_error "镜像导出失败"
    exit 1
fi

# 传输镜像到服务器
print_step "步骤 4/6: 传输镜像到服务器"

print_info "传输文件: $IMAGE_TAR_PATH"
print_info "目标位置: $SERVER_USER@$SERVER_IP:$SERVER_PATH/"

# 确保服务器目录存在
SSH_CMD=$(build_ssh_cmd)
$SSH_CMD "mkdir -p $SERVER_PATH"

# 传输镜像文件
SCP_CMD=$(build_scp_cmd)
$SCP_CMD "$IMAGE_TAR_PATH" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

if [ $? -eq 0 ]; then
    print_success "镜像传输成功"
else
    print_error "镜像传输失败"
    exit 1
fi

# 传输配置文件
print_step "步骤 5/6: 传输配置文件到服务器"

print_info "传输 .env 文件..."
$SCP_CMD ".env" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
if [ $? -ne 0 ]; then
    print_error ".env 文件传输失败"
    exit 1
fi
print_success ".env 文件传输成功"

print_info "传输 docker-compose 配置..."
if [ -f "deploy-compose.yml" ]; then
    $SCP_CMD "deploy-compose.yml" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    if [ $? -ne 0 ]; then
        print_error "deploy-compose.yml 传输失败"
        exit 1
    fi
    print_success "deploy-compose.yml 传输成功"
else
    $SCP_CMD "docker-compose.yml" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    if [ $? -ne 0 ]; then
        print_error "docker-compose.yml 传输失败"
        exit 1
    fi
    print_success "docker-compose.yml 传输成功"
fi

if [ -f "librechat.yaml" ]; then
    print_info "传输 librechat.yaml 配置..."
    $SCP_CMD "librechat.yaml" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    if [ $? -ne 0 ]; then
        print_warning "librechat.yaml 传输失败，将使用默认配置"
    else
        print_success "librechat.yaml 传输成功"
    fi
else
    print_warning "跳过 librechat.yaml（文件不存在）"
fi

# 传输 nginx 配置（deploy-compose.yml 需要）
print_info "传输 nginx 配置..."
$SSH_CMD "mkdir -p $SERVER_PATH/client"
$SCP_CMD "client/nginx.conf" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/client/"
if [ $? -ne 0 ]; then
    print_error "nginx 配置传输失败"
    exit 1
fi
print_success "nginx 配置传输成功"
    fi
else
    print_warning "跳过 librechat.yaml（文件不存在）"
fi

print_info "传输远程部署脚本..."
$SCP_CMD "$SCRIPT_DIR/remote-deploy.sh" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
if [ $? -ne 0 ]; then
    print_error "远程部署脚本传输失败"
    exit 1
fi
print_success "远程部署脚本传输成功"

print_success "所有配置文件传输完成"

# 清理本地临时文件
print_info "清理本地镜像文件..."
rm "$IMAGE_TAR_PATH"
print_success "本地临时文件已清理"

# 执行远程部署
print_step "步骤 6/6: 执行远程部署"

print_info "连接到服务器并执行部署脚本..."
$SSH_CMD "cd $SERVER_PATH && chmod +x remote-deploy.sh && IMAGE_TAR=$IMAGE_TAR IMAGE_NAME=$FULL_IMAGE_NAME ./remote-deploy.sh"

if [ $? -eq 0 ]; then
    print_step "部署完成！"
    print_success "LibreChat 已成功部署到服务器"
    echo ""
    print_info "访问地址: http://$SERVER_IP:3080"
    print_info "查看日志: ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker compose logs -f'"
    echo ""
else
    print_error "远程部署失败，请检查服务器日志"
    exit 1
fi
