# LibreChat 部署指南

本目录包含 LibreChat 的自动化部署脚本，支持从本地构建镜像并部署到远程服务器。

## 📋 目录结构

```
deploy/
├── config.sh              # 部署配置文件
├── local-deploy.sh        # 本地部署脚本（主脚本）
├── remote-deploy.sh       # 远程服务器执行脚本
├── pre-deploy-check.sh    # 部署前检查脚本
└── README.md             # 本文档
```

## 🚀 快速开始

### 1. 准备配置文件

在项目根目录下准备以下配置文件：

#### 必需文件：

- **`.env`** - 环境变量配置
  ```bash
  cp .env.example .env
  # 编辑 .env 文件，配置必需的环境变量
  ```

- **`deploy-compose.yml`** 或 **`docker-compose.yml`** - Docker Compose 配置
  - 项目已包含 `deploy-compose.yml`

#### 推荐文件：

- **`librechat.yaml`** - LibreChat 应用配置
  ```bash
  cp librechat.example.yaml librechat.yaml
  # 编辑 librechat.yaml 文件，配置 AI 模型等
  ```

### 2. 配置部署参数

编辑 `deploy/config.sh` 文件：

```bash
# 服务器配置
SERVER_IP="your.server.ip"        # 服务器 IP 地址
SERVER_USER="root"                # SSH 用户名
SERVER_PATH="/opt/librechat"      # 服务器部署路径
SSH_KEY_PATH=""                   # SSH 密钥路径（可选）

# 镜像配置
IMAGE_NAME="librechat-api"
IMAGE_TAG="latest"

# 构建配置
DOCKERFILE="Dockerfile.multi"
BUILD_TARGET="api-build"
```

### 3. 运行部署前检查

```bash
cd deploy
chmod +x *.sh
./pre-deploy-check.sh
```

检查脚本会验证：
- 必需文件是否存在
- .env 配置是否完整
- Docker 环境是否正常
- 服务器连接是否正常
- 服务器 Docker 环境
- 磁盘空间
- 端口占用情况

### 4. 执行部署

```bash
./local-deploy.sh
```

部署流程包括：
1. 检查本地环境
2. 构建 Docker 镜像
3. 导出镜像为 tar 文件
4. 传输镜像到服务器
5. 传输配置文件到服务器
6. 在服务器上执行部署

## 📝 .env 配置说明

### 必需配置项

```bash
# MongoDB 连接
MONGO_URI=mongodb://mongodb:27017/LibreChat

# 安全密钥（必须修改为随机值）
CREDS_KEY=your_random_32_char_hex_string
CREDS_IV=your_random_16_char_hex_string
JWT_SECRET=your_random_jwt_secret
JWT_REFRESH_SECRET=your_random_refresh_secret

# MeiliSearch
MEILI_MASTER_KEY=your_random_master_key
```

### AI API Keys（至少配置一个）

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GOOGLE_KEY=...
```

### 生成随机密钥

```bash
# 生成 CREDS_KEY (32 字节 hex)
openssl rand -hex 32

# 生成 CREDS_IV (16 字节 hex)
openssl rand -hex 16

# 生成 JWT_SECRET
openssl rand -hex 32

# 生成 MEILI_MASTER_KEY
openssl rand -base64 32
```

## 🔧 服务器要求

### 系统要求

- 操作系统: Linux (Ubuntu 20.04+ / CentOS 7+ / Debian 10+)
- CPU: 2 核心以上
- 内存: 4GB 以上
- 磁盘: 20GB 以上可用空间

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- SSH 访问权限

### 端口要求

确保以下端口可用：
- `3080` - LibreChat API
- `80` - HTTP (可选)
- `443` - HTTPS (可选)
- `27017` - MongoDB (内部)
- `7700` - MeiliSearch (内部)

## 📦 部署的服务

部署完成后，以下服务将在服务器上运行：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| API | LibreChat-API | 3080 | LibreChat 主服务 |
| NGINX | LibreChat-NGINX | 80, 443 | Web 服务器 |
| MongoDB | chat-mongodb | 27017 | 数据库 |
| MeiliSearch | chat-meilisearch | 7700 | 搜索引擎 |
| VectorDB | vectordb | 5432 | 向量数据库 |
| RAG API | rag_api | 8000 | RAG 服务 |

## 🔍 部署后检查

### 查看服务状态

```bash
ssh user@server
cd /opt/librechat
docker compose -f deploy-compose.yml ps
```

### 查看日志

```bash
# 查看所有服务日志
docker compose -f deploy-compose.yml logs -f

# 查看 API 日志
docker compose -f deploy-compose.yml logs -f api

# 查看最近 100 行日志
docker compose -f deploy-compose.yml logs --tail=100
```

### 访问应用

浏览器访问: `http://your-server-ip:3080`

## 🛠️ 常用命令

### 重启服务

```bash
docker compose -f deploy-compose.yml restart
```

### 停止服务

```bash
docker compose -f deploy-compose.yml down
```

### 更新部署

重新运行本地部署脚本：

```bash
cd deploy
./local-deploy.sh
```

### 备份数据

```bash
# 备份 MongoDB 数据
docker exec chat-mongodb mongodump --out /data/backup

# 备份上传文件
tar -czf uploads-backup.tar.gz uploads/

# 备份配置文件
tar -czf config-backup.tar.gz .env librechat.yaml
```

## ⚠️ 故障排查

### 服务无法启动

1. 检查日志：
   ```bash
   docker compose -f deploy-compose.yml logs
   ```

2. 检查配置文件：
   ```bash
   cat .env
   cat librechat.yaml
   ```

3. 检查端口占用：
   ```bash
   netstat -tuln | grep -E '3080|80|443'
   ```

### 无法连接数据库

1. 检查 MongoDB 容器状态：
   ```bash
   docker compose -f deploy-compose.yml ps mongodb
   ```

2. 检查 MONGO_URI 配置：
   ```bash
   grep MONGO_URI .env
   ```

### API 返回 500 错误

1. 检查环境变量配置
2. 检查 API 日志
3. 确认至少配置了一个 AI API Key

## 📚 更多信息

- [LibreChat 官方文档](https://www.librechat.ai/docs)
- [配置参考](https://www.librechat.ai/docs/configuration/dotenv)
- [Docker 部署指南](https://www.librechat.ai/docs/deployment/docker)

## 🤝 支持

如遇问题，请：
1. 查看日志文件
2. 检查配置文件
3. 参考官方文档
4. 提交 Issue
