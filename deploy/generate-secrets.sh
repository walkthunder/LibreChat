#!/bin/bash
# 生成 LibreChat 所需的安全密钥

# 颜色配置
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}LibreChat 密钥生成工具${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 检查 openssl 是否安装
if ! command -v openssl &> /dev/null; then
    echo -e "${YELLOW}错误: openssl 未安装${NC}"
    echo "请先安装 openssl"
    exit 1
fi

echo -e "${GREEN}正在生成密钥...${NC}"
echo ""

# 生成密钥
CREDS_KEY=$(openssl rand -hex 32)
CREDS_IV=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
MEILI_MASTER_KEY=$(openssl rand -base64 32)

# 显示生成的密钥
echo -e "${BLUE}生成的密钥（请复制到 .env 文件）:${NC}"
echo ""
echo "CREDS_KEY=$CREDS_KEY"
echo "CREDS_IV=$CREDS_IV"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "MEILI_MASTER_KEY=$MEILI_MASTER_KEY"
echo ""

# 询问是否自动添加到 .env 文件
read -p "是否自动添加到 .env 文件？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENV_FILE="../.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}.env 文件不存在，正在创建...${NC}"
        touch "$ENV_FILE"
    fi
    
    # 检查是否已存在这些配置
    if grep -q "^CREDS_KEY=" "$ENV_FILE"; then
        echo -e "${YELLOW}警告: .env 文件中已存在密钥配置${NC}"
        read -p "是否覆盖现有配置？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 0
        fi
        
        # 删除旧配置
        sed -i.bak '/^CREDS_KEY=/d' "$ENV_FILE"
        sed -i.bak '/^CREDS_IV=/d' "$ENV_FILE"
        sed -i.bak '/^JWT_SECRET=/d' "$ENV_FILE"
        sed -i.bak '/^JWT_REFRESH_SECRET=/d' "$ENV_FILE"
        sed -i.bak '/^MEILI_MASTER_KEY=/d' "$ENV_FILE"
    fi
    
    # 添加新配置
    cat >> "$ENV_FILE" << EOF

# 安全密钥（自动生成于 $(date))
CREDS_KEY=$CREDS_KEY
CREDS_IV=$CREDS_IV
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
MEILI_MASTER_KEY=$MEILI_MASTER_KEY
EOF
    
    echo -e "${GREEN}✓ 密钥已添加到 .env 文件${NC}"
else
    echo "请手动复制上述密钥到 .env 文件"
fi

echo ""
echo -e "${GREEN}完成！${NC}"
