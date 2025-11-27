# LibreChat 部署流程详解

## 📊 完整部署流程图

```
┌─────────────────────────────────────────────────────────────┐
│                     部署准备阶段                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 准备配置文件                                              │
│     ├─ 复制 .env.example → .env                              │
│     ├─ 复制 librechat.example.yaml → librechat.yaml         │
│     └─ 编辑 deploy/config.sh                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 生成安全密钥                                              │
│     └─ 运行: ./deploy/generate-secrets.sh                    │
│        ├─ CREDS_KEY (32 bytes hex)                          │
│        ├─ CREDS_IV (16 bytes hex)                           │
│        ├─ JWT_SECRET (32 bytes hex)                         │
│        ├─ JWT_REFRESH_SECRET (32 bytes hex)                 │
│        └─ MEILI_MASTER_KEY (base64)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 配置 AI API Keys                                         │
│     └─ 在 .env 中至少配置一个:                                │
│        ├─ OPENAI_API_KEY                                     │
│        ├─ ANTHROPIC_API_KEY                                  │
│        └─ GOOGLE_KEY                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 运行部署前检查                                            │
│     └─ 运行: ./deploy/pre-deploy-check.sh                    │
│        ├─ 检查必需文件                                        │
│        ├─ 验证 .env 配置                                      │
│        ├─ 检查 Docker 环境                                    │
│        ├─ 测试服务器连接                                      │
│        ├─ 检查磁盘空间                                        │
│        └─ 检查端口占用                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  检查是否通过？   │
                    └─────────────────┘
                         │         │
                      是 │         │ 否
                         │         └──────────┐
                         ▼                    ▼
┌─────────────────────────────────────┐  ┌──────────────┐
│         本地部署阶段                 │  │  修复问题     │
│  (运行 ./deploy/local-deploy.sh)    │  └──────────────┘
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 1/6: 检查环境                  │         │
│  ├─ 检查 Docker                     │         │
│  ├─ 检查 scp/ssh                    │         │
│  └─ 检查配置文件                     │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 2/6: 构建 Docker 镜像          │         │
│  └─ docker build -f Dockerfile.multi│         │
│     -t librechat-api:latest         │         │
│     --target api-build .            │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 3/6: 导出镜像                  │         │
│  └─ docker save librechat-api:latest│         │
│     > librechat-api-latest.tar      │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 4/6: 传输镜像到服务器           │         │
│  └─ scp librechat-api-latest.tar    │         │
│     user@server:/opt/librechat/     │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 5/6: 传输配置文件               │         │
│  ├─ scp .env                        │         │
│  ├─ scp deploy-compose.yml          │         │
│  ├─ scp librechat.yaml              │         │
│  └─ scp remote-deploy.sh            │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 6/6: 执行远程部署               │         │
│  └─ ssh user@server                 │         │
│     "cd /opt/librechat &&           │         │
│      ./remote-deploy.sh"            │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────────────┐ │
│            远程服务器部署阶段                 │ │
│     (自动执行 remote-deploy.sh)              │ │
└─────────────────────────────────────────────┘ │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 1/7: 加载 Docker 镜像          │         │
│  └─ docker load <                   │         │
│     librechat-api-latest.tar        │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 2/7: 验证镜像                  │         │
│  └─ docker images | grep            │         │
│     librechat-api                   │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 3/7: 检查 Compose 配置         │         │
│  └─ 查找 deploy-compose.yml 或      │         │
│     docker-compose.yml              │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 4/7: 检查配置文件               │         │
│  ├─ 检查 .env 文件                   │         │
│  ├─ 验证必需环境变量                  │         │
│  ├─ 检查 librechat.yaml              │         │
│  └─ 创建数据目录                      │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 5/7: 停止旧服务                 │         │
│  └─ docker compose down             │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 6/7: 清理临时文件               │         │
│  └─ rm librechat-api-latest.tar     │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
┌─────────────────────────────────────┐         │
│  步骤 7/7: 启动服务                  │         │
│  ├─ docker compose up -d            │         │
│  ├─ 等待服务启动                     │         │
│  ├─ 检查服务健康状态                  │         │
│  └─ 显示服务信息                     │         │
└─────────────────────────────────────┘         │
                    │                           │
                    ▼                           │
            ┌───────────────┐                   │
            │ 部署是否成功？ │                   │
            └───────────────┘                   │
                 │       │                      │
              是 │       │ 否                   │
                 │       └──────────────────────┘
                 ▼
┌─────────────────────────────────────┐
│          部署完成                    │
│  ├─ 服务运行在 3080 端口             │
│  ├─ 访问 http://server-ip:3080      │
│  └─ 查看日志: docker compose logs -f │
└─────────────────────────────────────┘
```

## 🔄 部署流程时间估算

| 阶段 | 预计时间 | 说明 |
|------|---------|------|
| 准备配置文件 | 5-10 分钟 | 首次配置需要更多时间 |
| 生成密钥 | 1 分钟 | 自动化脚本 |
| 配置 API Keys | 2-5 分钟 | 取决于已有的 API Keys |
| 运行检查 | 1-2 分钟 | 自动化检查 |
| 构建镜像 | 5-15 分钟 | 取决于网络和机器性能 |
| 传输镜像 | 2-10 分钟 | 取决于网络速度和镜像大小 |
| 远程部署 | 3-5 分钟 | 包括启动所有服务 |
| **总计** | **20-50 分钟** | 首次部署 |
| **更新部署** | **10-20 分钟** | 已有配置的情况下 |

## 📦 部署的服务详解

### 服务启动顺序

```
1. VectorDB (PostgreSQL with pgvector)
   └─ 端口: 5432 (内部)
   └─ 用途: 向量数据库

2. MongoDB
   └─ 端口: 27017 (内部)
   └─ 用途: 主数据库

3. MeiliSearch
   └─ 端口: 7700 (内部)
   └─ 用途: 搜索引擎

4. RAG API
   └─ 端口: 8000 (内部)
   └─ 用途: RAG 服务
   └─ 依赖: VectorDB

5. LibreChat API
   └─ 端口: 3080
   └─ 用途: 主应用服务
   └─ 依赖: MongoDB, MeiliSearch, RAG API

6. NGINX
   └─ 端口: 80, 443
   └─ 用途: Web 服务器
   └─ 依赖: LibreChat API
```

### 数据持久化

```
服务器目录结构:
/opt/librechat/
├── .env                          # 环境变量
├── librechat.yaml                # 应用配置
├── deploy-compose.yml            # Docker Compose 配置
├── remote-deploy.sh              # 部署脚本
├── librechat-api-latest.tar      # 镜像文件（临时）
├── data-node/                    # MongoDB 数据
├── meili_data_v1.12/             # MeiliSearch 数据
├── images/                       # 图片文件
├── uploads/                      # 上传文件
└── logs/                         # 日志文件
```

## 🔍 部署验证流程

### 1. 服务状态检查

```bash
# 连接到服务器
ssh user@server

# 进入部署目录
cd /opt/librechat

# 查看所有服务状态
docker compose -f deploy-compose.yml ps

# 预期输出：所有服务状态为 "Up"
```

### 2. 日志检查

```bash
# 查看所有服务日志
docker compose -f deploy-compose.yml logs

# 查看 API 日志
docker compose -f deploy-compose.yml logs api

# 实时查看日志
docker compose -f deploy-compose.yml logs -f

# 查看最近 100 行
docker compose -f deploy-compose.yml logs --tail=100
```

### 3. 网络连接测试

```bash
# 测试 API 端口
curl http://localhost:3080

# 测试健康检查端点（如果有）
curl http://localhost:3080/health

# 从外部测试
curl http://your-server-ip:3080
```

### 4. 功能测试

1. **访问 Web 界面**
   - 浏览器打开: `http://your-server-ip:3080`
   - 应该看到 LibreChat 登录页面

2. **用户注册**
   - 点击注册
   - 填写邮箱和密码
   - 成功创建账户

3. **创建对话**
   - 登录后创建新对话
   - 发送测试消息
   - 验证 AI 响应

## 🚨 故障排查流程

### 问题诊断流程图

```
服务无法访问
    │
    ▼
检查服务是否运行
    │
    ├─ 是 ──▶ 检查端口是否开放
    │         │
    │         ├─ 是 ──▶ 检查防火墙规则
    │         │         │
    │         │         └─ 配置防火墙
    │         │
    │         └─ 否 ──▶ 检查端口占用
    │                   │
    │                   └─ 释放端口或修改配置
    │
    └─ 否 ──▶ 查看日志
              │
              ├─ 配置错误 ──▶ 修复配置文件
              │
              ├─ 依赖服务未启动 ──▶ 启动依赖服务
              │
              └─ 资源不足 ──▶ 增加资源或优化配置
```

### 常见错误及解决方案

#### 1. 镜像构建失败

**错误信息**: `docker build failed`

**可能原因**:
- 网络问题
- Dockerfile 语法错误
- 依赖包下载失败

**解决方案**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
cd deploy
./local-deploy.sh
```

#### 2. 服务启动失败

**错误信息**: `container exited with code 1`

**可能原因**:
- 环境变量配置错误
- 端口被占用
- 依赖服务未启动

**解决方案**:
```bash
# 查看详细日志
docker compose -f deploy-compose.yml logs api

# 检查配置
cat .env

# 检查端口
netstat -tuln | grep 3080
```

#### 3. 数据库连接失败

**错误信息**: `MongoError: connect ECONNREFUSED`

**可能原因**:
- MongoDB 未启动
- MONGO_URI 配置错误

**解决方案**:
```bash
# 检查 MongoDB 状态
docker compose -f deploy-compose.yml ps mongodb

# 重启 MongoDB
docker compose -f deploy-compose.yml restart mongodb

# 检查配置
grep MONGO_URI .env
```

#### 4. API Key 错误

**错误信息**: `Invalid API key`

**可能原因**:
- API Key 未配置
- API Key 格式错误
- API Key 已过期

**解决方案**:
```bash
# 检查 API Key 配置
grep -E "OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_KEY" .env

# 更新 API Key
nano .env

# 重启服务
docker compose -f deploy-compose.yml restart api
```

## 📊 性能优化建议

### 1. 资源配置

```yaml
# 在 deploy-compose.yml 中添加资源限制
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. 日志管理

```yaml
# 配置日志轮转
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 缓存优化

```bash
# 在 .env 中启用 Redis
USE_REDIS=true
REDIS_URI=redis://redis:6379
```

## 🔄 更新部署流程

### 更新现有部署

```bash
# 1. 备份当前配置
ssh user@server "cd /opt/librechat && tar -czf backup-$(date +%Y%m%d).tar.gz .env librechat.yaml data-node/"

# 2. 重新运行部署脚本
cd deploy
./local-deploy.sh

# 3. 验证更新
ssh user@server "cd /opt/librechat && docker compose ps"
```

### 回滚到之前版本

```bash
# 1. 停止当前服务
ssh user@server "cd /opt/librechat && docker compose down"

# 2. 恢复备份
ssh user@server "cd /opt/librechat && tar -xzf backup-YYYYMMDD.tar.gz"

# 3. 启动服务
ssh user@server "cd /opt/librechat && docker compose up -d"
```

## 📝 部署检查清单

- [ ] 所有配置文件已准备
- [ ] 安全密钥已生成
- [ ] AI API Keys 已配置
- [ ] 服务器信息已配置
- [ ] 部署前检查已通过
- [ ] 部署脚本执行成功
- [ ] 所有服务状态正常
- [ ] Web 界面可访问
- [ ] 功能测试通过
- [ ] 日志无错误
- [ ] 配置已备份

---

**完成所有步骤后，你的 LibreChat 就成功部署了！** 🎉
