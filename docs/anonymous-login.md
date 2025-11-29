# 匿名登录功能说明

## 概述

本系统实现了基于浏览器指纹的无感登录功能，用户无需注册即可自动登录使用系统。

## 功能特点

1. **无需注册**：用户首次访问时自动创建匿名账户
2. **浏览器指纹识别**：基于浏览器特征生成唯一标识
3. **自动登录**：下次访问时自动识别并登录
4. **数据持久化**：匿名用户的对话历史会被保存

## 工作原理

### 浏览器指纹生成

系统会收集以下浏览器特征来生成唯一指纹：

- User Agent（浏览器标识）
- 语言设置
- 操作系统平台
- 屏幕分辨率和色深
- 时区
- Canvas指纹
- WebGL指纹

这些特征组合后通过SHA-256哈希生成唯一的机器ID。

### 用户创建流程

1. 用户访问登录页面
2. 前端自动生成浏览器指纹
3. 发送指纹到后端 `/api/auth/anonymous` 接口
4. 后端根据指纹生成机器ID
5. 检查是否存在对应的匿名用户
   - 如果存在：直接登录
   - 如果不存在：创建新的匿名用户
6. 返回JWT token，完成登录

### 匿名用户特征

- 邮箱格式：`anonymous_{machineId}@librechat.local`
- 用户名：`anonymous_{machineId前8位}`
- 显示名称：`访客用户`
- 角色：普通用户（USER）
- 邮箱已验证：true（自动验证）

## 配置方法

### 1. 环境变量配置

在 `.env` 文件中添加：

```bash
# 启用匿名登录
ALLOW_ANONYMOUS_LOGIN=true
```

### 2. 可选配置

如果需要同时支持传统登录和匿名登录：

```bash
# 允许邮箱登录
ALLOW_EMAIL_LOGIN=true

# 允许用户注册
ALLOW_REGISTRATION=true

# 启用匿名登录
ALLOW_ANONYMOUS_LOGIN=true
```

### 3. 仅匿名登录模式

如果只想使用匿名登录，禁用其他登录方式：

```bash
# 禁用邮箱登录
ALLOW_EMAIL_LOGIN=false

# 禁用用户注册
ALLOW_REGISTRATION=false

# 禁用社交登录
ALLOW_SOCIAL_LOGIN=false

# 启用匿名登录
ALLOW_ANONYMOUS_LOGIN=true
```

## 技术实现

### 后端实现

#### 1. 匿名认证中间件 (`api/server/middleware/anonymousAuth.js`)

```javascript
// 生成机器ID
const generateMachineId = (fingerprint) => {
  const fingerprintString = JSON.stringify(fingerprint);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

// 匿名认证中间件
const anonymousAuth = async (req, res, next) => {
  const { fingerprint } = req.body;
  const machineId = generateMachineId(fingerprint);
  const anonymousEmail = `anonymous_${machineId}@librechat.local`;
  
  // 查找或创建用户
  let user = await findUser({ email: anonymousEmail });
  if (!user) {
    user = await createUser({
      provider: 'anonymous',
      email: anonymousEmail,
      username: `anonymous_${machineId.substring(0, 8)}`,
      name: `访客用户`,
      role: SystemRoles.USER,
      emailVerified: true,
    });
  }
  
  req.user = user;
  next();
};
```

#### 2. 路由配置 (`api/server/routes/auth.js`)

```javascript
router.post(
  '/anonymous',
  middleware.logHeaders,
  middleware.checkBan,
  anonymousAuth,
  setBalanceConfig,
  anonymousLoginController,
);
```

### 前端实现

#### 1. 浏览器指纹生成 (`client/src/utils/browserFingerprint.ts`)

```typescript
export const generateBrowserFingerprint = async (): Promise<BrowserFingerprint> => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
  };
};
```

#### 2. 匿名登录Hook (`client/src/hooks/Auth/useAnonymousLogin.ts`)

```typescript
export const useAnonymousLogin = ({ enabled, onSuccess, onError }) => {
  useEffect(() => {
    if (!enabled) return;
    
    const attemptAnonymousLogin = async () => {
      const fingerprint = await getOrGenerateFingerprint();
      anonymousLoginMutation.mutate({ fingerprint });
    };
    
    attemptAnonymousLogin();
  }, [enabled]);
};
```

#### 3. 登录页面集成 (`client/src/components/Auth/Login.tsx`)

```typescript
const anonymousLoginEnabled = startupConfig?.anonymousLoginEnabled === true;

useAnonymousLogin({
  enabled: anonymousLoginEnabled,
  onSuccess: (data) => {
    silentLogin?.(data);
  },
});
```

## 安全考虑

### 1. 指纹唯一性

浏览器指纹虽然能够识别大部分用户，但存在以下情况：

- 同一设备的不同浏览器会生成不同指纹
- 隐私模式/无痕模式可能生成不同指纹
- 浏览器更新可能改变某些特征

### 2. 数据隔离

- 每个匿名用户的数据完全隔离
- 无法跨设备/浏览器访问同一账户
- 清除浏览器数据会导致重新创建新账户

### 3. 限制措施

建议配合以下措施使用：

```bash
# 限制并发消息数
LIMIT_CONCURRENT_MESSAGES=true
CONCURRENT_MESSAGE_MAX=2

# 限制IP消息频率
LIMIT_MESSAGE_IP=true
MESSAGE_IP_MAX=40
MESSAGE_IP_WINDOW=1

# 启用违规检测
BAN_VIOLATIONS=true
```

## 使用场景

### 适用场景

1. **演示系统**：快速展示功能，无需注册
2. **内部工具**：企业内网环境，简化登录流程
3. **临时访问**：允许用户先体验再决定是否注册
4. **公共服务**：提供无障碍访问的AI服务

### 不适用场景

1. **需要跨设备同步**：匿名用户无法跨设备访问
2. **需要严格身份验证**：无法确保用户真实身份
3. **需要账户管理**：无法找回密码或修改账户信息

## 故障排查

### 1. 匿名登录失败

检查环境变量：
```bash
# 确认已启用
ALLOW_ANONYMOUS_LOGIN=true
```

检查日志：
```bash
# 查看后端日志
docker-compose logs -f api

# 搜索匿名登录相关日志
docker-compose logs api | grep anonymousAuth
```

### 2. 重复创建用户

可能原因：
- 浏览器指纹不稳定
- LocalStorage被清除
- 使用了隐私模式

解决方案：
- 检查浏览器设置
- 避免频繁清除缓存
- 使用正常模式访问

### 3. 无法自动登录

检查前端配置：
```javascript
// 确认startupConfig中包含anonymousLoginEnabled
console.log(startupConfig?.anonymousLoginEnabled);
```

检查浏览器控制台：
```javascript
// 查看是否有错误信息
// 检查fingerprint是否正确生成
```

## 升级到正式账户

如果需要将匿名用户升级为正式账户，可以添加以下功能：

1. 在用户设置中添加"绑定邮箱"功能
2. 验证邮箱后更新用户信息
3. 修改provider从'anonymous'改为'local'

示例代码：

```javascript
// 后端API
router.post('/upgrade-account', requireJwtAuth, async (req, res) => {
  const { email, password } = req.body;
  const userId = req.user._id;
  
  // 检查用户是否为匿名用户
  if (req.user.provider !== 'anonymous') {
    return res.status(400).json({ message: '只有匿名用户可以升级账户' });
  }
  
  // 更新用户信息
  const salt = bcrypt.genSaltSync(10);
  await updateUser(userId, {
    email,
    password: bcrypt.hashSync(password, salt),
    provider: 'local',
    emailVerified: false,
  });
  
  // 发送验证邮件
  await sendVerificationEmail({ _id: userId, email });
  
  res.json({ message: '账户升级成功，请查收验证邮件' });
});
```

## 总结

匿名登录功能通过浏览器指纹技术实现了无需注册的自动登录，适合演示、内部工具等场景。在使用时需要注意其局限性，并配合适当的安全措施。
