#!/usr/bin/env bash
# 传输 RAG 镜像到服务器并加载

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/config.sh"

cd "$PROJECT_ROOT"

print_step "传输 RAG 镜像到服务器"

# 检查参数
if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ]; then
    print_error "请在 deploy/config.sh 中设置 SERVER_IP 和 SERVER_USER"
    exit 1
fi

print_info "目标服务器: $SERVER_USER@$SERVER_IP"
print_info "部署路径: $SERVER_PATH"

# 检查镜像文件是否存在
if [ ! -d "$LOCAL_IMAGE_DIR" ] || [ -z "$(ls -A $LOCAL_IMAGE_DIR 2>/dev/null)" ]; then
    print_error "镜像文件不存在"
    print_info "请先运行: ./deploy/pull-rag-images.sh"
    exit 1
fi

print_info "找到以下镜像文件:"
ls -lh "$LOCAL_IMAGE_DIR"
echo ""

# 检查工具
check_command scp
check_command ssh

SSH_CMD=$(build_ssh_cmd)
SCP_CMD=$(build_scp_cmd)

# 创建服务器目录
print_step "准备服务器目录"
$SSH_CMD "mkdir -p $SERVER_PATH/rag-images"
print_success "服务器目录已创建"

# 传输镜像文件
print_step "传输镜像文件"

for tar_file in "$LOCAL_IMAGE_DIR"/*.tar; do
    if [ -f "$tar_file" ]; then
        filename=$(basename "$tar_file")
        print_info "传输: $filename"
        
        # 使用 rsync 如果可用（支持断点续传）
        if command -v rsync &> /dev/null; then
            rsync -avz --progress "$tar_file" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/rag-images/"
        else
            $SCP_CMD "$tar_file" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/rag-images/"
        fi
        
        if [ $? -eq 0 ]; then
            print_success "传输完成: $filename"
        else
            print_error "传输失败: $filename"
            exit 1
        fi
    fi
done

print_success "所有镜像文件传输完成"

# 创建远程加载脚本
print_step "创建远程加载脚本"

cat > /tmp/load-rag-images.sh <<'EOF'
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

echo ""
echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}加载 RAG 镜像${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装"
    exit 1
fi

# 加载镜像
for tar_file in rag-images/*.tar; do
    if [ -f "$tar_file" ]; then
        print_info "加载: $(basename $tar_file)"
        
        if docker load < "$tar_file"; then
            print_success "加载成功"
        else
            print_error "加载失败: $tar_file"
            exit 1
        fi
    fi
done

echo ""
print_success "所有镜像加载完成"
echo ""

# 显示已加载的镜像
print_info "已加载的 RAG 相关镜像:"
docker images | grep -E "rag-api|pgvector"

echo ""
print_info "清理镜像文件..."
rm -rf rag-images
print_success "清理完成"

echo ""
print_success "RAG 镜像已准备就绪"
echo ""
print_info "现在可以启动服务了:"
echo "  cd $SERVER_PATH"
echo "  docker compose -f deploy-compose.yml up -d"
EOF

# 传输加载脚本
$SCP_CMD /tmp/load-rag-images.sh "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
rm /tmp/load-rag-images.sh

print_success "加载脚本已传输"

# 在服务器上执行加载
print_step "在服务器上加载镜像"

$SSH_CMD "cd $SERVER_PATH && chmod +x load-rag-images.sh && ./load-rag-images.sh"

if [ $? -eq 0 ]; then
    print_step "完成！"
    print_success "RAG 镜像已成功加载到服务器"
    echo ""
    print_info "下一步:"
    print_info "1. 确保 .env 和 deploy-compose.yml 已上传到服务器"
    print_info "2. 在服务器上运行: cd $SERVER_PATH && docker compose -f deploy-compose.yml up -d"
    echo ""
else
    print_error "镜像加载失败"
    exit 1
fi

# 询问是否清理本地文件
echo ""
read -p "是否清理本地镜像文件? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$LOCAL_IMAGE_DIR"
    print_success "本地镜像文件已清理"
fi
