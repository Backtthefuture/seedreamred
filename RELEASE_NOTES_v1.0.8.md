# v1.0.8 版本发布说明

## 发布信息
- **版本号**: 1.0.8
- **发布日期**: 2025-09-10
- **类型**: 错误修复版本

## 核心问题修复

### 🔧 修复图片下载CORS问题
**问题描述**：
- 豆包API返回的图片URL指向TOS对象存储服务器
- 浏览器CORS策略阻止直接访问这些图片
- 导致图片无法下载，批量下载功能失效

**解决方案**：
1. 在Vite配置中添加 `/proxy/tos` 代理路径
2. 实现URL智能转换机制
3. 所有TOS图片请求通过本地代理转发

## 技术实现细节

### 1. 代理配置（vite.config.ts）
```javascript
'/proxy/tos': {
  target: 'https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com',
  changeOrigin: true,
  secure: false,
  rewrite: (path) => path.replace(/^\/proxy\/tos/, '')
}
```

### 2. URL转换逻辑（downloadService.ts）
```javascript
private static convertToProxyUrl(url: string): string {
  if (url.includes('ark-content-generation') && url.includes('.tos-cn-beijing.volces.com')) {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    return `/proxy/tos${path}`;
  }
  return url;
}
```

## 影响范围

### ✅ 已修复
- 图片下载不再被CORS阻止
- 批量下载功能恢复正常
- 单张图片下载正常

### ✅ 不受影响
- AI文本拆分功能
- 图片生成API调用
- 模板系统
- UI组件和交互
- 其他所有功能模块

## 测试验证

### 功能测试清单
- [x] Vite开发服务器正常启动
- [x] TOS代理配置生效
- [x] URL转换逻辑正确
- [x] 代理请求日志正常输出
- [x] 图片生成功能正常
- [x] 图片下载无CORS错误
- [x] 批量下载功能正常
- [x] AI拆分功能不受影响

### 测试步骤
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:5173
3. 输入测试文本（100字以上）
4. 选择模板并点击"智能拆分"
5. 点击"生成图片"
6. 等待图片生成完成
7. 点击"批量下载"验证下载功能

## 已知限制
- 仅在开发环境解决了CORS问题
- 生产环境需要配置反向代理或使用CDN

## 升级建议
- 直接更新代码即可
- 无需修改配置
- 无需清理缓存

## 后续优化
- 考虑添加图片缓存机制
- 优化下载进度显示
- 支持更多图片格式

---

*发布者: Claude Assistant*
*审核状态: 已验证*