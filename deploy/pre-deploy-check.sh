#!/bin/bash
# LibreChat 部署前检查脚本

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 加载配置
source "$SCRIPT_DIR/config.sh"

cd "$PROJECT_ROOT"

print_step "LibreChat 部署前检查"

# 检查结果统计
ERRORS=0
WARNINGS=0

# 1. 检查必需文件
print_step "1. 检查必需文件"

check_file() {
    local file=$1
    local required=$2
    
    if [ -f "$file" ]; then
        print_success "$file 存在"
        return 0
    else
        if [ "$required" = "true" ]; then
            print_error "$file 不存在（必需）"
            ERRORS=$((ERRORS + 1))
        else
            print_warning "$file 不存在（可选）"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

check_file ".env" "true"
check_file "librechat.yaml" "false"
check_file "deploy-compose.yml" "false" || check_file "docker-compose.yml" "true"
check_file "Dockerfile.multi" "true"

# 2. 检查 .env 配置
print_step "2. 检查 .env 配置"

if [ -f ".env" ]; then
    REQUIRED_ENV_VARS=(
        "MONGO_URI"
        "CREDS_KEY"
        "CREDS_IV"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "MEILI_MASTER_KEY"
    )
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "^${var}=" .env && ! grep -q "^${var}=$" .env && ! grep -q "^${var}=\s*$" .env; then
            # 检查是否使用了示例值
            if grep -q "^${var}=.*example" .env || grep -q "^${var}=.*changeme" .env; then
                print_warning "$var 使用了示例值，建议修改"
                WARNINGS=$((WARNINGS + 1))
            else
                print_success "$var 已配置"
            fi
        else
            print_error "$var 未配置或为空"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # 检查 API Keys（可选但推荐）
    OPTIONAL_API_KEYS=(
        "OPENAI_API_KEY"
        "ANTHROPIC_API_KEY"
        "GOOGLE_KEY"
    )
    
    HAS_API_KEY=false
    for var in "${OPTIONAL_API_KEYS[@]}"; do
        if grep -q "^${var}=" .env && ! grep -q "^${var}=$" .env && ! grep -q "^${var}=user_provided" .env; then
            print_success "$var 已配置"
            HAS_API_KEY=true
        fi
    done
    
    if [ "$HAS_API_KEY" = false ]; then
        print_warning "未配置任何 AI API Key，应用可能无法正常使用"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# 3. 检查 Docker 环境
print_step "3. 检查 Docker 环境"

if command -v docker &> /dev/null; then
    print_success "Docker 已安装"
    
    if docker info &> /dev/null; then
        print_success "Docker 运行正常"
        DOCKER_VERSION=$(docker --version)
        print_info "版本: $DOCKER_VERSION"
    else
        print_error "Docker 未运行"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "Docker 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 4. 检查网络连接
print_step "4. 检查服务器连接"

if [ -n "$SERVER_IP" ] && [ -n "$SERVER_USER" ]; then
    print_info "目标服务器: $SERVER_USER@$SERVER_IP"
    
    SSH_CMD=$(build_ssh_cmd)
    if $SSH_CMD "echo 'SSH 连接测试成功'" &> /dev/null; then
        print_success "SSH 连接正常"
        
        # 检查服务器 Docker
        if $SSH_CMD "command -v docker" &> /dev/null; then
            print_success "服务器已安装 Docker"
        else
            print_error "服务器未安装 Docker"
            ERRORS=$((ERRORS + 1))
        fi
        
        # 检查服务器 Docker Compose
        if $SSH_CMD "command -v docker compose || command -v docker-compose" &> /dev/null; then
            print_success "服务器已安装 Docker Compose"
        else
            print_error "服务器未安装 Docker Compose"
            ERRORS=$((ERRORS + 1))
        fi
    else
        print_error "无法连接到服务器"
        print_info "请检查 SERVER_IP、SERVER_USER 和 SSH 配置"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "服务器配置不完整"
    print_info "请在 deploy/config.sh 中配置 SERVER_IP 和 SERVER_USER"
    ERRORS=$((ERRORS + 1))
fi

# 5. 检查磁盘空间
print_step "5. 检查磁盘空间"

AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
print_info "本地可用空间: $AVAILABLE_SPACE"

if [ -n "$SERVER_IP" ] && [ -n "$SERVER_USER" ]; then
    SSH_CMD=$(build_ssh_cmd)
    if $SSH_CMD "echo 'test'" &> /dev/null; then
        SERVER_SPACE=$($SSH_CMD "df -h $SERVER_PATH 2>/dev/null | awk 'NR==2 {print \$4}' || echo '未知'")
        print_info "服务器可用空间: $SERVER_SPACE"
    fi
fi

# 6. 检查端口占用（服务器）
print_step "6. 检查服务器端口"

if [ -n "$SERVER_IP" ] && [ -n "$SERVER_USER" ]; then
    SSH_CMD=$(build_ssh_cmd)
    if $SSH_CMD "echo 'test'" &> /dev/null; then
        PORTS=(3080 80 443 27017 7700)
        for port in "${PORTS[@]}"; do
            if $SSH_CMD "command -v netstat &> /dev/null && netstat -tuln | grep -q :$port || command -v ss &> /dev/null && ss -tuln | grep -q :$port" 2>/dev/null; then
                print_warning "端口 $port 已被占用"
                WARNINGS=$((WARNINGS + 1))
            else
                print_success "端口 $port 可用"
            fi
        done
    fi
fi

# 总结
print_step "检查结果总结"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "所有检查通过！可以开始部署"
    echo ""
    print_info "运行以下命令开始部署:"
    print_info "  cd deploy && ./local-deploy.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    print_warning "检查完成，发现 $WARNINGS 个警告"
    echo ""
    print_info "可以继续部署，但建议先处理警告"
    print_info "运行以下命令开始部署:"
    print_info "  cd deploy && ./local-deploy.sh"
    exit 0
else
    print_error "检查失败，发现 $ERRORS 个错误和 $WARNINGS 个警告"
    echo ""
    print_info "请先解决上述错误后再部署"
    exit 1
fi
