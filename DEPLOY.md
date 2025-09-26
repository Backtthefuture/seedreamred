# 📦 部署指南 - 文字转小红书 v1.4.0

## 🚀 Vercel 部署步骤

### 前置准备

1. **确保项目可以本地构建**
   ```bash
   npm run build
   ```
   
2. **Git 仓库准备**
   ```bash
   # 查看当前状态
   git status
   
   # 添加所有更改
   git add .
   
   # 提交更改
   git commit -m "v1.4.0: UI optimization and ready for deployment"
   ```

### 方案一：GitHub + Vercel（推荐）

#### 步骤 1：创建 GitHub 仓库

1. 访问 [github.com/new](https://github.com/new)
2. 仓库名称：`text-to-xiaohongshu`
3. 设置为 Public 或 Private
4. 不要初始化 README（项目已有）

#### 步骤 2：推送代码到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/text-to-xiaohongshu.git

# 推送代码
git push -u origin main
```

#### 步骤 3：连接 Vercel

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 "Import Git Repository"
3. 授权访问你的 GitHub
4. 选择 `text-to-xiaohongshu` 仓库

#### 步骤 4：配置部署

Vercel 会自动检测配置，确认以下设置：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 步骤 5：环境变量（如需要）

在 Settings → Environment Variables 添加：
```
VITE_DOUBAO_API_KEY=your_actual_api_key
```

#### 步骤 6：部署

点击 "Deploy" 并等待完成！

### 方案二：Vercel CLI 部署

#### 安装和登录

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login
```

#### 快速部署

```bash
# 在项目根目录执行
vercel

# 选择以下选项：
# ? Set up and deploy "~/text-to-xiaohongshu"? [Y/n] Y
# ? Which scope do you want to deploy to? 选择你的用户名
# ? Link to existing project? [y/N] N
# ? What's your project's name? text-to-xiaohongshu
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N
```

#### 生产部署

```bash
vercel --prod
```

## ⚠️ 重要注意事项

### 1. API 代理处理

当前项目使用 Vite 代理配置处理 API 请求，但 **Vercel 生产环境不支持 Vite 代理**。

**解决方案：**

#### 方案 A：使用 Vercel Functions（推荐）

创建 `/api/proxy.js`：
```javascript
export default async function handler(req, res) {
  const { url, ...options } = req.body;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`
      }
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 方案 B：直接调用 API

修改 `apiClient.ts` 直接调用豆包 API（需要豆包 API 支持 CORS）。

### 2. 环境变量配置

- **本地开发**: 使用 `.env` 文件
- **Vercel 部署**: 在控制台设置环境变量
- **注意**: `VITE_` 前缀的变量会暴露给客户端

### 3. 域名配置

部署成功后，你会获得：
- 默认域名：`text-to-xiaohongshu.vercel.app`
- 可以在 Settings → Domains 添加自定义域名

### 4. 性能优化建议

1. **启用 Edge Network**
   - Vercel 自动启用全球 CDN

2. **图片优化**
   - 考虑使用 Vercel 的图片优化服务

3. **缓存策略**
   - 静态资源会自动缓存
   - API 响应可配置缓存

## 🔍 部署后验证

1. **基础功能测试**
   - [ ] 首页加载正常
   - [ ] 文本输入功能
   - [ ] AI 拆分功能
   - [ ] 图片生成功能
   - [ ] 下载功能

2. **UI 测试**
   - [ ] 渐变背景显示
   - [ ] 玻璃拟态效果
   - [ ] 拖拽上传功能
   - [ ] 响应式布局

3. **性能测试**
   - [ ] 首屏加载时间 < 3s
   - [ ] 交互响应流畅

## 📊 监控和分析

Vercel 提供内置的：
- **Analytics**: 页面性能分析
- **Web Vitals**: 核心网页指标
- **Logs**: 实时日志查看

## 🆘 常见问题

### Q: 构建失败
A: 检查 Node 版本，确保 >= 18

### Q: API 调用失败
A: 检查环境变量是否正确设置

### Q: 页面刷新 404
A: 确认 `vercel.json` 中的 rewrites 配置

### Q: 样式丢失
A: 清除浏览器缓存，检查 CSS 构建

## 📞 支持

- Vercel 文档：[vercel.com/docs](https://vercel.com/docs)
- 项目 Issues：GitHub Issues
- 社区支持：Vercel Discord

---

祝部署顺利！🎉