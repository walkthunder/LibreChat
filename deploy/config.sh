#!/bin/bash
# LibreChat 部署配置文件

# ==================== 服务器配置 ====================
# 请根据实际情况修改以下配置

# 服务器 IP 地址
SERVER_IP="124.221.46.229"

# 服务器用户名
SERVER_USER="root"

# 服务器部署路径
SERVER_PATH="/opt/librechat"

# SSH 密钥路径（可选，留空则使用密码登录）
SSH_KEY_PATH=""

# ==================== 镜像配置 ====================

# Docker 镜像名称
IMAGE_NAME="librechat-api"

# 镜像标签
IMAGE_TAG="latest"

# 完整镜像名称
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# 镜像文件名
IMAGE_TAR="librechat-api-${IMAGE_TAG}.tar"

# 本地镜像存储目录
LOCAL_IMAGE_DIR="./docker-images"

# ==================== 构建配置 ====================

# Dockerfile 路径
DOCKERFILE="Dockerfile.multi"

# 构建目标
BUILD_TARGET="api-build"

# ==================== 颜色配置 ====================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== 辅助函数 ====================

# 打印成功信息
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 打印错误信息
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 打印警告信息
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 打印信息
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 打印步骤标题
print_step() {
    echo ""
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}======================================${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 构建 SSH 命令
build_ssh_cmd() {
    if [ -n "$SSH_KEY_PATH" ]; then
        echo "ssh -i $SSH_KEY_PATH $SERVER_USER@$SERVER_IP"
    else
        echo "ssh $SERVER_USER@$SERVER_IP"
    fi
}

# 构建 SCP 命令
build_scp_cmd() {
    if [ -n "$SSH_KEY_PATH" ]; then
        echo "scp -i $SSH_KEY_PATH"
    else
        echo "scp"
    fi
}
