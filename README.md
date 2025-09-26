# 📱 文字转小红书 v1.6.1

一款智能的文本转小红书图文工具，通过AI语义分析和豆包图像生成模型，让博主一键将长文本转化为高质量的小红书图文内容。

![Version](https://img.shields.io/badge/version-1.6.1-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

## 功能特点

- 🤖 **AI智能拆分**：基于语义理解将长文本智能拆分为封面和内容图片
- 🎨 **多样化模板**：提供5种预设风格模板，支持自定义模板
- 🖼️ **一键生成**：集成豆包API，快速生成高质量图片
- 📥 **批量下载**：支持一键打包下载所有生成的图片
- 🔄 **重新生成**：单张图片支持独立重新生成

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.0
- **状态管理**: Zustand
- **样式方案**: Tailwind CSS
- **构建工具**: Vite
- **其他**: Axios, JSZip, FileSaver.js

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用指南

### 1. 配置API密钥

首次使用时，需要配置豆包API密钥：
- 点击顶部的"API设置"按钮
- 输入你的豆包API密钥
- 点击"测试连接"验证密钥是否有效
- 保存密钥（密钥将安全存储在浏览器本地）

### 2. 输入文本

在左侧输入区输入或粘贴你的文本内容（至少100字）

### 3. 智能拆分

点击"智能拆分"按钮，AI将自动将文本拆分为：
- 1张封面（30-50字的核心观点）
- 3-8张内容图（每张50-100字）

### 4. 选择模板

从以下预设模板中选择：
- 简约风
- 可爱风
- 商务风
- 生活风
- 美食风

或创建自定义模板

### 5. 生成图片

点击"立即生成所有图片"，系统将：
- 根据选定模板生成提示词
- 调用豆包API生成图片
- 实时显示生成进度

### 6. 下载保存

- 单张重新生成：点击每张图片的"重新生成"按钮
- 批量下载：点击"批量下载"按钮，下载ZIP压缩包

## 注意事项

1. **API密钥**：请使用真实的豆包API密钥替换模拟API
2. **API调用**：当前使用模拟API，实际使用时需要修改 `src/services/apiClient.ts`
3. **图片生成**：实际API可能有并发限制，建议使用串行生成

## 项目结构

```
src/
├── components/        # React组件
├── stores/           # 状态管理
├── services/         # 业务逻辑
├── utils/            # 工具函数
├── types/            # TypeScript类型
└── App.tsx           # 应用入口
```

## 开发说明

### 修改API接入

编辑 `src/services/apiClient.ts` 文件，将模拟API替换为真实的豆包API：

```typescript
// 替换API地址
const DOUBAO_API_BASE = 'https://api.doubao.com/v1';

// 修改generateImage方法
async generateImage(prompt: string): Promise<string> {
  const response = await this.client.post('/image/generate', {
    prompt,
    model: 'doubao-image-v1',
    // 其他参数...
  });
  return response.data.url;
}
```

### 添加新模板

在 `src/utils/constants.ts` 中添加新的预设模板：

```typescript
export const PRESET_TEMPLATES: Template[] = [
  // 添加新模板
  {
    id: 'new_style',
    name: '新风格',
    coverPrompt: '...',
    contentPrompt: '...',
    isPreset: true,
  },
];
```

## 🚀 部署到 Vercel

### 方法一：通过 GitHub 自动部署（推荐）

1. **准备 GitHub 仓库**
   ```bash
   # 初始化 git（如果还没有）
   git init
   
   # 添加所有文件
   git add .
   
   # 提交代码
   git commit -m "Deploy to Vercel"
   
   # 添加远程仓库（替换为你的仓库地址）
   git remote add origin https://github.com/YOUR_USERNAME/text-to-xiaohongshu.git
   
   # 推送到 GitHub
   git push -u origin main
   ```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "Import Project"
   - 选择你的 `text-to-xiaohongshu` 仓库
   - Vercel 会自动检测到这是一个 Vite 项目

3. **配置环境变量**（如果需要）
   - 在 Vercel 项目设置中
   - 进入 Settings → Environment Variables
   - 添加必要的环境变量（如 API 密钥）

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（通常 1-2 分钟）
   - 获得你的项目 URL：`https://your-project.vercel.app`

### 方法二：使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 在项目根目录运行
   vercel
   
   # 按提示操作：
   # - Set up and deploy? Y
   # - Which scope? 选择你的账号
   # - Link to existing project? N
   # - Project name? text-to-xiaohongshu
   # - In which directory is your code located? ./
   # - Override settings? N
   ```

4. **生产部署**
   ```bash
   vercel --prod
   ```

### 部署注意事项

1. **API 代理问题**
   - Vercel 生产环境不支持 Vite 的代理配置
   - 需要使用 Vercel Functions 或直接调用 API（需要 CORS 支持）

2. **环境变量**
   - 本地开发使用 `.env` 文件
   - Vercel 部署需在控制台设置环境变量
   - 使用 `VITE_` 前缀的变量会暴露给客户端

3. **构建配置**
   - 项目已包含 `vercel.json` 配置文件
   - 自动处理 SPA 路由重写

## License

MIT