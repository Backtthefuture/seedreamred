# 🚀 版本 v1.5.0 发布说明

**发布日期**: 2025-09-11  
**版本号**: v1.5.0  
**主题**: Vercel部署支持与API代理优化

## 🎯 版本亮点

本次更新主要聚焦于**生产环境部署支持**，通过引入 Vercel Functions 完美解决了生产环境的 CORS 问题，实现了开发与生产环境的无缝切换。

## ✨ 新增功能

### 1. 🌐 Vercel 平台完整支持
- **一键部署**: 支持通过 GitHub 直接部署到 Vercel
- **自动 CI/CD**: 每次代码推送自动触发部署
- **全球 CDN**: 利用 Vercel 全球节点加速访问

### 2. 🔐 API 代理架构升级
- **Vercel Functions**: 创建了三个 Serverless Functions
  - `api/doubao-chat.js` - 处理 AI 文本拆分请求
  - `api/doubao-images.js` - 处理图片生成请求
  - `api/doubao-tos-proxy.js` - 处理图片下载代理
- **CORS 问题解决**: 通过服务端代理彻底解决跨域问题
- **环境自适应**: 开发/生产环境自动切换，无需手动修改代码

### 3. 🔑 安全性增强
- **API 密钥保护**: 密钥存储在服务端，不再暴露到客户端
- **环境变量管理**: 规范化环境变量配置
- **请求验证**: Functions 层面增加请求合法性验证

## 🛠 技术改进

### API 调用优化
```typescript
// 统一的 API 路径
const API_BASE = '/api';
// 开发环境：Vite 代理处理
// 生产环境：Vercel Functions 处理
```

### 部署配置优化
```json
// vercel.json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 30-60
    }
  },
  "rewrites": [
    { "source": "/api/chat", "destination": "/api/doubao-chat" },
    { "source": "/api/images", "destination": "/api/doubao-images" },
    { "source": "/api/tos-proxy", "destination": "/api/doubao-tos-proxy" }
  ]
}
```

## 📦 文件变更

### 新增文件
- `api/doubao-chat.js` - Chat API 代理函数
- `api/doubao-images.js` - Images API 代理函数  
- `api/doubao-tos-proxy.js` - TOS 图片代理函数
- `RELEASE_NOTES_v1.5.0.md` - 版本发布说明

### 修改文件
- `vercel.json` - 添加 Functions 配置和路由重写
- `src/services/apiClient.ts` - 移除硬编码 API Key，支持环境判断
- `src/services/aiService.ts` - 适配新的 API 调用方式
- `.env.example` - 更新环境变量说明
- `PRD.md` - 添加 v1.5.0 版本架构说明

## 🚀 部署指南

### 1. 准备工作
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "v1.5.0: Vercel deployment support"
git push origin main
```

### 2. Vercel 部署
1. 访问 [vercel.com](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置环境变量：
   - `DOUBAO_API_KEY`: 你的豆包 API 密钥
4. 点击 Deploy 完成部署

### 3. 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器（无需额外配置）
npm run dev
```

## ⚠️ 注意事项

1. **环境变量配置**
   - 生产环境：在 Vercel Dashboard 设置 `DOUBAO_API_KEY`
   - 本地开发：可选在 `.env.local` 设置（已被 .gitignore 忽略）

2. **向后兼容性**
   - 本地开发体验完全不变
   - 现有 Vite 配置继续有效
   - 所有功能模块正常工作

3. **API 密钥安全**
   - 不要使用 `VITE_` 前缀的环境变量存储敏感信息
   - API 密钥只在服务端使用，客户端无法访问

## 🎉 升级收益

- ✅ **生产就绪**: 可直接部署到生产环境使用
- ✅ **性能提升**: CDN 加速，全球访问快速响应
- ✅ **安全增强**: API 密钥服务端管理，更加安全
- ✅ **维护简化**: 自动部署，代码推送即生效
- ✅ **扩展性好**: Serverless 架构，自动扩缩容

## 📊 版本信息

- **版本号**: 1.5.0
- **发布分支**: main
- **兼容性**: 完全向后兼容
- **最低 Node 版本**: 18.x

## 🔄 下一步计划

- [ ] 优化 chunk 大小，实现代码分割
- [ ] 添加更多图片尺寸选项
- [ ] 支持批量操作优化
- [ ] 增加部署状态监控

---

*感谢使用文字转小红书工具！如有问题请提交 Issue。*