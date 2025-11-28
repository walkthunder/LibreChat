# RAG 镜像部署指南

## 快速开始

### 方式 1：一键部署（推荐）

```bash
# 拉取 + 传输 + 加载，一步完成
./deploy/rag-deploy-simple.sh
```

### 方式 2：分步部署

```bash
# 步骤 1: 在本地拉取镜像
./deploy/pull-rag-images.sh

# 步骤 2: 传输到服务器并加载
./deploy/transfer-rag-images.sh
```

---

## 详细说明

### 需要拉取的镜像

1. **RAG API 服务**
   - 镜像: `ghcr.io/danny-avila/librechat-rag-api-dev-lite:latest`
   - 大小: 约 800MB
   - 用途: 提供 RAG（检索增强生成）功能

2. **向量数据库**
   - 镜像: `pgvector/pgvector:0.8.0-pg15-trixie`
   - 大小: 约 400MB
   - 用途: 存储文档向量

**总大小: 约 1.2GB**

---

## 使用说明

### 前置条件

1. 本地已安装 Docker
2. 已配置 `deploy/config.sh` 中的服务器信息：
   ```bash
   SERVER_IP="your-server-ip"
   SERVER_USER="root"
   SERVER_PATH="/opt/librechat"
   ```

### 脚本说明

#### 1. `pull-rag-images.sh` - 拉取镜像

**功能：**
- 拉取 RAG API 和向量数据库镜像
- 保存为 tar 文件到 `./docker-images/` 目录

**使用：**
```bash
./deploy/pull-rag-images.sh
```

**输出：**
```
./docker-images/
├── rag_api.tar      # 约 800MB
└── vectordb.tar     # 约 400MB
```

#### 2. `transfer-rag-images.sh` - 传输并加载

**功能：**
- 传输镜像文件到服务器
- 在服务器上加载镜像
- 自动清理临时文件

**使用：**
```bash
./deploy/transfer-rag-images.sh
```

**注意：** 需要先运行 `pull-rag-images.sh`

#### 3. `rag-deploy-simple.sh` - 一键部署

**功能：**
- 自动执行拉取、传输、加载全流程
- 最简单的使用方式

**使用：**
```bash
./deploy/rag-deploy-simple.sh
```

---

## 常见问题

### Q1: 拉取镜像很慢怎么办？

**A:** 配置 Docker 镜像加速器：

```bash
# 在本地机器上执行
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.m.daocloud.io"
  ]
}
EOF

sudo systemctl restart docker
```

### Q2: 传输文件很慢怎么办？

**A:** 脚本会自动使用 rsync（如果可用），支持断点续传。

如果中断了，再次运行 `transfer-rag-images.sh` 即可继续。

### Q3: 如何验证镜像是否加载成功？

**A:** 在服务器上运行：

```bash
docker images | grep -E "rag-api|pgvector"
```

应该看到：
```
ghcr.io/danny-avila/librechat-rag-api-dev-lite   latest   ...   800MB
pgvector/pgvector                                 0.8.0... ...   400MB
```

### Q4: 部署后如何启动服务？

**A:** 在服务器上运行：

```bash
cd /opt/librechat
docker compose -f deploy-compose.yml up -d
```

查看服务状态：
```bash
docker compose -f deploy-compose.yml ps
```

查看日志：
```bash
docker compose -f deploy-compose.yml logs -f rag_api
```

---

## 故障排查

### 镜像拉取失败

```bash
# 检查 Docker 是否运行
docker info

# 检查网络连接
ping ghcr.io

# 手动拉取测试
docker pull pgvector/pgvector:0.8.0-pg15-trixie
```

### 传输失败

```bash
# 检查 SSH 连接
ssh root@your-server-ip

# 检查服务器磁盘空间
ssh root@your-server-ip "df -h"

# 手动传输测试
scp docker-images/vectordb.tar root@your-server-ip:/tmp/
```

### 加载失败

```bash
# 在服务器上手动加载
ssh root@your-server-ip
cd /opt/librechat/rag-images
docker load < rag_api.tar
docker load < vectordb.tar
```

---

## 完整部署流程示例

```bash
# 1. 配置服务器信息
vim deploy/config.sh

# 2. 一键部署 RAG 镜像
./deploy/rag-deploy-simple.sh

# 3. 确保配置文件已上传
scp .env root@your-server:/opt/librechat/
scp deploy-compose.yml root@your-server:/opt/librechat/
scp librechat.yaml root@your-server:/opt/librechat/

# 4. 在服务器上启动服务
ssh root@your-server
cd /opt/librechat
docker compose -f deploy-compose.yml up -d

# 5. 查看服务状态
docker compose -f deploy-compose.yml ps
docker compose -f deploy-compose.yml logs -f
```

---

## 性能优化建议

### 1. 使用 rsync 传输

```bash
# 安装 rsync（如果没有）
sudo apt-get install rsync  # Ubuntu/Debian
sudo yum install rsync      # CentOS/RHEL
```

### 2. 压缩传输（节省带宽）

```bash
# 手动压缩传输
tar czf rag-images.tar.gz docker-images/
scp rag-images.tar.gz root@server:/tmp/
ssh root@server "cd /tmp && tar xzf rag-images.tar.gz"
```

### 3. 并行传输（如果有多个文件）

```bash
# 使用 GNU parallel
ls docker-images/*.tar | parallel -j 2 scp {} root@server:/tmp/
```

---

## 技术支持

如果遇到问题：

1. 查看脚本输出的错误信息
2. 检查 Docker 日志：`docker logs <container-id>`
3. 查看系统日志：`journalctl -u docker -f`
4. 确保服务器有足够的磁盘空间（至少 5GB）

---

## 相关文档

- [国内网络部署指南](./CHINA-NETWORK-GUIDE.md)
- [加速技巧](./SPEED-UP-TIPS.md)
- [完整部署流程](./DEPLOYMENT-FLOW.md)
