# Design Document

## Overview

本设计为LibreChat聊天界面添加URL参数支持，允许通过查询字符串控制UI状态、指定对话上下文以及自动化消息发送。该功能将通过创建自定义React Hook来解析和管理URL参数，并在相关组件中集成这些参数的处理逻辑。

设计遵循以下原则：
- 最小侵入性：尽可能复用现有组件和状态管理机制
- 向后兼容：不影响现有功能和用户体验
- 可扩展性：便于未来添加新的URL参数
- 安全性：验证所有输入参数，防止注入攻击

## Architecture

### 高层架构

```
URL Parameters → useUrlParams Hook → Component State → UI Rendering
                      ↓
                 Validation & Parsing
                      ↓
                 State Management (Recoil/Local State)
```

### 组件层次

1. **URL参数解析层** (`useUrlParams` Hook)
   - 解析URL查询参数
   - 验证参数值
   - 提供类型安全的参数访问接口

2. **状态管理层** (Root.tsx, ChatRoute.tsx)
   - 接收解析后的参数
   - 更新组件状态
   - 触发相应的UI变化

3. **UI渲染层** (Nav, GovHeader, ChatView)
   - 根据状态渲染UI
   - 保持交互功能完整性

## Components and Interfaces

### 1. useUrlParams Hook

**位置**: `client/src/hooks/useUrlParams.ts`

**接口定义**:
```typescript
interface UrlParams {
  sidebar?: 'hidden' | 'visible';
  navbar?: 'hidden' | 'visible';
  conversationId?: string;
  agentId?: string;
  message?: string;
  autoSend?: boolean;
}

interface UseUrlParamsReturn {
  params: UrlParams;
  isValid: boolean;
  errors: string[];
}

function useUrlParams(): UseUrlParamsReturn;
```

**职责**:
- 从`window.location.search`解析查询参数
- 验证参数格式和值
- URL解码特殊字符
- 返回类型安全的参数对象

### 2. Root Component 增强

**位置**: `client/src/routes/Root.tsx`

**修改内容**:
- 集成`useUrlParams` Hook
- 根据`sidebar`参数初始化`navVisible`状态
- 根据`navbar`参数控制`GovHeader`的渲染
- 通过Context传递URL参数给子组件

**新增接口**:
```typescript
interface UrlParamsContextValue {
  urlParams: UrlParams;
  isUrlControlled: boolean;
}
```

### 3. ChatRoute Component 增强

**位置**: `client/src/routes/ChatRoute.tsx`

**修改内容**:
- 从URL参数中提取`conversationId`和`agentId`
- 优先使用URL参数中的conversationId
- 处理`message`和`autoSend`参数
- 在对话初始化完成后自动发送消息

**新增状态**:
```typescript
interface AutoSendState {
  message: string;
  shouldSend: boolean;
  hasSent: boolean;
}
```

### 4. ChatView Component 增强

**位置**: `client/src/components/Chat/ChatView.tsx`

**修改内容**:
- 接收来自ChatRoute的消息预填充指令
- 提供`setMessageText`方法用于外部设置消息内容
- 提供`submitMessage`方法用于外部触发消息发送
- 确保在对话上下文就绪后才执行自动发送

## Data Models

### URL参数模型

```typescript
// 支持的URL参数
type UrlParamKey = 
  | 'sidebar'
  | 'navbar'
  | 'conversationId'
  | 'agentId'
  | 'message'
  | 'autoSend';

// 参数值类型映射
interface UrlParamValueTypes {
  sidebar: 'hidden' | 'visible';
  navbar: 'hidden' | 'visible';
  conversationId: string;
  agentId: string;
  message: string;
  autoSend: 'true' | 'false';
}

// 解析后的参数对象
interface ParsedUrlParams {
  sidebar?: 'hidden' | 'visible';
  navbar?: 'hidden' | 'visible';
  conversationId?: string;
  agentId?: string;
  message?: string;
  autoSend?: boolean;
}
```

### 参数优先级规则

```typescript
interface ParameterPrecedence {
  // conversationId优先于agentId
  conversationSelection: 'conversationId' | 'agentId';
  
  // URL参数不覆盖localStorage，但提供初始值
  sidebarVisibility: 'url' | 'localStorage' | 'default';
  
  // autoSend需要message参数存在
  autoSendRequirement: 'message' & 'autoSend';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sidebar visibility parameter application

*For any* sidebar parameter value ('hidden', 'visible', or absent), the Chat Interface should render with the sidebar in the corresponding state (hidden, visible, or default visible), and manual toggling should remain functional
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Navbar visibility parameter application

*For any* navbar parameter value ('hidden', 'visible', or absent), the Chat Interface should render with the navbar in the corresponding state, and when hidden, the layout should utilize full vertical space
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Invalid parameter fallback

*For any* URL containing invalid parameter values (for sidebar, navbar, or other parameters), the system should use default behavior for invalid parameters while successfully applying all valid parameters
**Validates: Requirements 1.4, 2.4, 5.4**

### Property 4: Conversation loading by ID

*For any* valid conversationId parameter, the Chat Interface should load and display that specific conversation
**Validates: Requirements 3.1**

### Property 5: Agent initialization by ID

*For any* valid agentId parameter (when conversationId is not present), the Chat Interface should initialize a new conversation with the specified agent
**Validates: Requirements 3.2**

### Property 6: ConversationId precedence over agentId

*For any* URL containing both conversationId and agentId parameters, the system should load the conversation specified by conversationId and ignore the agentId parameter
**Validates: Requirements 3.3**

### Property 7: Invalid ID error handling

*For any* non-existent or inaccessible conversationId or agentId, the system should display an appropriate error message and load the default view
**Validates: Requirements 3.4, 3.5**

### Property 8: Message URL encoding round-trip

*For any* text message, encoding it as a URL parameter then decoding should produce the original text with all special characters preserved correctly
**Validates: Requirements 4.1, 4.5**

### Property 9: Auto-send dependency on message

*For any* URL with autoSend=true, a message should only be sent automatically if a valid message parameter is also present
**Validates: Requirements 4.3**

### Property 10: Auto-send initialization timing

*For any* auto-send operation, the message should only be submitted after the conversation context is fully initialized
**Validates: Requirements 4.4**

### Property 11: Auto-send error recovery

*For any* auto-send operation that fails due to network or validation errors, the system should display the error message and retain the message text in the input field
**Validates: Requirements 4.6**

### Property 12: Multiple parameter independence

*For any* combination of valid URL parameters, each parameter should be applied independently and all should take effect simultaneously without interfering with each other
**Validates: Requirements 5.1**

### Property 13: Dynamic URL parameter updates

*For any* URL parameter change while the application is running, the Chat Interface should reflect the changes without requiring a full page reload where possible
**Validates: Requirements 5.3**

### Property 14: Core functionality preservation

*For any* UI state modified by URL parameters, all core chat functionality (sending messages, viewing history, changing settings) should remain fully operational
**Validates: Requirements 6.1**

### Property 15: Navigation preservation after URL load

*For any* conversation loaded via URL parameter, the user should be able to navigate to other conversations normally
**Validates: Requirements 6.4**

## Error Handling

### 参数验证错误

```typescript
enum UrlParamError {
  INVALID_SIDEBAR_VALUE = 'Invalid sidebar parameter value',
  INVALID_NAVBAR_VALUE = 'Invalid navbar parameter value',
  CONVERSATION_NOT_FOUND = 'Conversation ID not found',
  AGENT_NOT_FOUND = 'Agent ID not found',
  INVALID_MESSAGE_ENCODING = 'Message parameter contains invalid encoding',
  AUTO_SEND_WITHOUT_MESSAGE = 'autoSend requires message parameter',
}
```

### 错误处理策略

1. **参数格式错误**: 记录警告日志，使用默认值
2. **对话/Agent不存在**: 显示Toast提示，加载默认视图
3. **消息解码失败**: 显示错误提示，清空输入框
4. **自动发送失败**: 保留消息文本，显示错误提示，允许用户手动重试

### 降级方案

```typescript
interface FallbackBehavior {
  invalidSidebar: 'use-default-visible';
  invalidNavbar: 'use-default-visible';
  invalidConversationId: 'load-new-conversation';
  invalidAgentId: 'load-default-agent';
  invalidMessage: 'clear-input-field';
  autoSendFailure: 'retain-message-show-error';
}
```

## Testing Strategy

### Unit Testing

使用Vitest进行单元测试，重点测试：

1. **useUrlParams Hook测试**
   - 各种参数组合的解析
   - URL编码/解码
   - 无效参数处理
   - 边界情况（空字符串、特殊字符等）

2. **参数验证逻辑测试**
   - 枚举值验证
   - 布尔值转换
   - ID格式验证

3. **组件集成测试**
   - Root组件的参数应用
   - ChatRoute的对话加载
   - 自动发送逻辑

### Property-Based Testing

使用`fast-check`库进行属性测试，配置每个测试运行至少100次迭代。

**测试库**: fast-check (JavaScript/TypeScript的property-based testing库)

**标注格式**: 每个property-based测试必须使用注释标注对应的correctness property
```typescript
// **Feature: chat-url-parameters, Property 1: URL参数解析幂等性**
```

### Integration Testing

1. **端到端URL参数流程**
   - 完整的参数解析→状态更新→UI渲染流程
   - 多参数组合场景
   - 用户交互后的状态保持

2. **错误场景测试**
   - 不存在的对话ID
   - 不存在的Agent ID
   - 网络错误时的自动发送

### 测试覆盖目标

- 单元测试覆盖率: >90%
- 属性测试: 所有10个correctness properties
- 集成测试: 所有6个requirements的关键路径

## Implementation Notes

### 技术选型

1. **URL解析**: 使用原生`URLSearchParams` API
2. **状态管理**: 复用现有的Recoil atoms和local state
3. **类型安全**: 使用TypeScript严格模式
4. **测试框架**: Vitest + fast-check + React Testing Library

### 性能考虑

1. **参数解析缓存**: useUrlParams使用useMemo缓存解析结果
2. **避免重复渲染**: 使用useEffect依赖数组精确控制
3. **懒加载对话**: 只在需要时加载conversationId指定的对话

### 安全考虑

1. **XSS防护**: 所有URL参数经过验证和清理
2. **访问控制**: 验证用户对指定对话/Agent的访问权限
3. **注入防护**: 消息内容经过适当的转义处理

### 可访问性

1. **屏幕阅读器**: 确保隐藏的UI元素正确标记`aria-hidden`
2. **键盘导航**: URL参数不影响键盘导航功能
3. **焦点管理**: 自动发送后焦点返回到输入框

### 浏览器兼容性

- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- URLSearchParams API在所有目标浏览器中可用
- 不依赖实验性Web API

## Future Enhancements

1. **参数持久化**: 将URL参数状态同步到localStorage
2. **分享链接生成**: 提供UI生成带参数的分享链接
3. **更多UI控制**: 支持隐藏更多UI元素（footer, banner等）
4. **预设配置**: 支持通过URL加载预设的对话配置
5. **批量消息**: 支持通过URL传递多条消息队列
