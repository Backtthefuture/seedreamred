# 🚀 Vercel部署指南

## 📋 部署前准备清单

### 1. 🔑 环境变量配置

在Vercel控制台的 **Settings → Environment Variables** 中添加以下变量：

```env
# 豆包API配置（图片生成和文本处理）
VITE_DOUBAO_API_KEY=f9772eba-6dd6-4154-adbf-b1e234a1b0ee

# Z-Pay支付配置
ZPAY_PID=2025062920440492
ZPAY_KEY=tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1

# 应用配置
VITE_APP_URL=https://your-domain.vercel.app
VITE_SITE_NAME=文字转小红书
ZPAY_DEMO_MODE=false

# Supabase配置
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

### 2. 🏗️ API代理处理

**问题**: Vercel生产环境不支持Vite的proxy配置

**解决方案**: 已创建Vercel Functions代理API请求

- ✅ `/api/doubao-chat.js` - 代理豆包Chat API
- ✅ `/api/doubao-images.js` - 代理豆包图片生成API
- ✅ `/api/payment/zpay-url.js` - Z-Pay支付链接生成
- ✅ `/api/payment/zpay-webhook.js` - Z-Pay支付回调处理

### 3. 📊 关键配置说明

#### 豆包API Key
- **当前使用**: `f9772eba-6dd6-4154-adbf-b1e234a1b0ee`
- **用途**: 文本AI处理和图片生成
- **费用**: 按API调用次数计费，由您的豆包账户承担
- **配置**: 设置为 `VITE_DOUBAO_API_KEY` 环境变量

#### 积分消耗机制
- **每张图片**: 20积分（约¥0.2）
- **新用户奖励**: 100积分
- **失败保护**: 生成失败自动返还积分

## 🚀 部署步骤

### 方法一：GitHub连接（推荐）

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **连接Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 选择GitHub仓库
   - 自动检测为Vite项目

3. **配置环境变量**
   - 在Vercel控制台添加上述环境变量
   - 特别注意设置正确的 `VITE_APP_URL`

4. **部署**
   - 点击Deploy
   - 等待构建完成

### 方法二：Vercel CLI

```bash
# 安装CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

## 🔧 部署后配置

### 1. 更新Z-Pay回调地址

在Z-Pay商户后台更新：
- **异步通知地址**: `https://your-domain.vercel.app/api/payment/zpay-webhook`
- **跳转地址**: `https://your-domain.vercel.app/payment/success`

### 2. 测试功能

- ✅ 用户注册登录
- ✅ 文本AI拆分
- ✅ 图片生成（积分消耗）
- ✅ 支付流程
- ✅ 积分充值

## ⚠️ 重要提醒

### API Key安全
- ✅ 已移到环境变量
- ✅ 不会暴露在客户端代码中
- ✅ 通过Vercel Functions安全调用

### 费用控制
- 豆包API按调用计费
- 建议监控API使用量
- 可在豆包控制台设置使用限额

### 生产环境优化
- 图片生成有积分限制，避免恶意使用
- 支付回调有签名验证，确保安全
- 用户认证防止未授权访问

## 🎯 部署成功标志

- [ ] 页面正常加载
- [ ] 用户可以注册登录
- [ ] AI文本拆分功能正常
- [ ] 图片生成消耗积分
- [ ] 支付流程完整
- [ ] 积分充值到账

## 📞 技术支持

如遇问题，检查：
1. Vercel Functions日志
2. 浏览器控制台错误
3. 环境变量配置
4. API调用限制

---

**准备好了吗？让我们部署到生产环境！** 🚀
