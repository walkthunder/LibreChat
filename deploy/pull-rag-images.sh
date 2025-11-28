#!/usr/bin/env bash
# 拉取 RAG 相关镜像并传输到服务器

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/config.sh"

cd "$PROJECT_ROOT"

print_step "拉取 RAG 相关镜像"

# 定义 RAG 相关镜像（使用数组而不是关联数组）
# 注意：明确指定 AMD64 架构
RAG_IMAGES=(
    "rag_api:ghcr.io/danny-avila/librechat-rag-api-dev-lite:latest"
    "vectordb:pgvector/pgvector:0.8.0-pg15-trixie"
)

# 检测目标架构
TARGET_PLATFORM="linux/amd64"

# 创建镜像存储目录
mkdir -p "$LOCAL_IMAGE_DIR"

print_info "将拉取以下镜像:"
for item in "${RAG_IMAGES[@]}"; do
    image="${item#*:}"
    echo "  - $image"
done
echo ""

# 拉取并保存镜像
for item in "${RAG_IMAGES[@]}"; do
    name="${item%%:*}"
    image="${item#*:}"
    tar_file="$LOCAL_IMAGE_DIR/${name}.tar"
    
    print_step "处理镜像: $name"
    print_info "镜像: $image"
    
    # 检查本地镜像架构
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
        # 检查架构是否正确
        arch=$(docker inspect "$image" --format='{{.Architecture}}' 2>/dev/null || echo "unknown")
        
        if [ "$arch" = "amd64" ]; then
            print_success "本地已有正确架构的镜像 (amd64)"
        else
            print_warning "本地镜像架构不匹配 (当前: $arch, 需要: amd64)"
            print_info "删除旧镜像..."
            docker rmi "$image" || true
            
            print_info "拉取 AMD64 镜像..."
            if docker pull --platform "$TARGET_PLATFORM" "$image"; then
                print_success "拉取成功"
            else
                print_error "拉取失败: $image"
                exit 1
            fi
        fi
    else
        print_info "拉取镜像 (平台: $TARGET_PLATFORM)..."
        
        # 明确指定平台拉取
        if docker pull --platform "$TARGET_PLATFORM" "$image"; then
            print_success "拉取成功"
        else
            print_error "拉取失败: $image"
            print_warning "请检查网络连接或配置镜像加速器"
            exit 1
        fi
    fi
    
    # 保存镜像
    print_info "保存镜像到: $tar_file"
    docker save "$image" > "$tar_file"
    
    if [ $? -eq 0 ]; then
        size=$(du -h "$tar_file" | cut -f1)
        print_success "镜像已保存 (大小: $size)"
    else
        print_error "镜像保存失败"
        exit 1
    fi
done

print_step "镜像拉取完成"
print_info "镜像文件保存在: $LOCAL_IMAGE_DIR"
ls -lh "$LOCAL_IMAGE_DIR"
echo ""

total_size=$(du -sh "$LOCAL_IMAGE_DIR" | cut -f1)
print_success "总大小: $total_size"
echo ""

print_info "下一步: 运行 ./deploy/transfer-rag-images.sh 传输到服务器"
