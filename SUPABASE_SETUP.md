# Supabase 认证功能设置指南

本项目已集成 Supabase 认证功能，支持用户注册、登录和积分管理。

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 等待项目初始化完成
3. 获取项目的 URL 和 anon key

### 2. 配置环境变量

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 Supabase 配置：
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. 设置数据库

1. 在 Supabase 控制台中，进入 "SQL Editor"
2. 复制 `supabase-setup.sql` 文件中的所有 SQL 代码
3. 粘贴到 SQL Editor 中并执行

这将创建以下表和功能：
- `user_profiles` - 用户档案表
- `credit_history` - 积分历史记录表（可选）
- 行级安全策略 (RLS)
- 自动触发器

### 4. 配置认证设置

在 Supabase 控制台的 "Authentication" > "Settings" 中：

1. **重要：禁用邮箱确认**：
   - 在 Authentication > Settings 页面
   - 找到 "Email Confirmation" 选项
   - 将其设置为 **禁用 (Disabled)**
   - 这是必需的，因为我们使用用户名而不是真实邮箱进行注册
   
2. **配置重定向 URL**：
   - 添加你的应用 URL 到 "Site URL" 和 "Redirect URLs"
   - 开发环境：`http://localhost:5173`
   - 生产环境：你的域名

## 🎯 功能特性

### 用户注册
- ✅ 用户名 + 密码注册
- ✅ 密码强度验证
- ✅ 用户名唯一性检查
- ✅ 首次注册赠送 100 积分

### 用户登录
- ✅ 用户名 + 密码登录
- ✅ 自动会话管理
- ✅ 登录状态持久化

### 积分系统
- ✅ 积分显示和管理
- ✅ 积分扣除和增加
- ✅ 积分历史记录（可选）

### 用户界面
- ✅ 现代化登录/注册模态框
- ✅ 用户信息下拉菜单
- ✅ 积分显示
- ✅ 一键登出

## 🔧 API 使用示例

### 注册用户
```typescript
import { useAuthStore } from './stores/useAuthStore';

const { signUp } = useAuthStore();

const handleRegister = async () => {
  const success = await signUp({
    username: 'testuser',
    password: 'password123',
    confirmPassword: 'password123'
  });
  
  if (success) {
    console.log('注册成功！');
  }
};
```

### 用户登录
```typescript
import { useAuthStore } from './stores/useAuthStore';

const { signIn } = useAuthStore();

const handleLogin = async () => {
  const success = await signIn({
    username: 'testuser',
    password: 'password123'
  });
  
  if (success) {
    console.log('登录成功！');
  }
};
```

### 积分操作
```typescript
import { useAuthStore } from './stores/useAuthStore';

const { deductCredits, addCredits, user } = useAuthStore();

// 扣除积分
const success = await deductCredits(10);

// 增加积分
const success = await addCredits(50);

// 获取当前积分
console.log('当前积分:', user?.credits);
```

## 🛡️ 安全特性

- **行级安全策略 (RLS)**：确保用户只能访问自己的数据
- **密码加密**：Supabase 自动处理密码加密
- **会话管理**：自动处理 JWT token 和刷新
- **输入验证**：前端和后端双重验证

## 🔍 故障排除

### 常见问题

1. **"找不到模块"错误**
   - 确保已安装 `@supabase/supabase-js` 依赖
   - 检查环境变量是否正确配置

2. **认证失败**
   - 检查 Supabase URL 和 anon key 是否正确
   - 确保数据库表已正确创建

3. **RLS 策略错误**
   - 确保已执行完整的 SQL 设置脚本
   - 检查 Supabase 控制台中的 RLS 策略是否启用

### 调试技巧

1. 打开浏览器开发者工具查看网络请求
2. 检查 Supabase 控制台的日志
3. 使用 `console.log` 调试认证状态

## 📝 数据库结构

### user_profiles 表
```sql
id          UUID (主键，关联 auth.users)
username    TEXT (唯一，用户名)
credits     INTEGER (积分，默认100)
created_at  TIMESTAMP (创建时间)
updated_at  TIMESTAMP (更新时间)
```

### credit_history 表（可选）
```sql
id          UUID (主键)
user_id     UUID (外键，关联 user_profiles)
amount      INTEGER (积分变化量)
reason      TEXT (变化原因)
created_at  TIMESTAMP (创建时间)
```

## 🎨 自定义

你可以根据需要自定义以下内容：

1. **修改初始积分**：在 `supabase-setup.sql` 中修改默认积分值
2. **添加用户字段**：扩展 `user_profiles` 表
3. **自定义 UI**：修改 `LoginModal.tsx` 和相关组件
4. **积分规则**：在 `authService.ts` 中自定义积分逻辑

## 📞 支持

如果遇到问题，请检查：
1. Supabase 官方文档
2. 项目的 GitHub Issues
3. 控制台错误信息