# 部署脚本使用说明

## 快速开始

### 1. 配置服务器
```bash
vim deploy/config.sh
```

修改：
- `SERVER_IP` - 服务器 IP
- `SERVER_USER` - SSH 用户名
- `SERVER_PATH` - 部署路径

### 2. 配置环境变量
```bash
cp .env.example .env
vim .env
```

### 3. 一键部署
```bash
npm run deploy
```

## 文件说明

- `config.sh` - 配置文件（服务器地址、镜像配置等）
- `local-deploy.sh` - 本地部署脚本（构建+传输+部署）
- `remote-deploy.sh` - 远程部署脚本（在服务器上执行）

详细文档请查看：[../DEPLOY.md](../DEPLOY.md)
