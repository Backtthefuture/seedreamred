# 💳 支付系统配置指南

## 🎯 概述

本项目集成了Z-Pay支付系统，支持微信支付和支付宝。目前运行在**演示模式**下，不会进行真实支付。

## 🚨 当前状态：演示模式

**现象**：
- 点击支付按钮后显示"演示模式"提示
- 不会跳转到真实的Z-Pay支付页面
- 控制台显示支付配置信息

**原因**：
- 使用的是演示商户ID (`demo_pid`)
- Z-Pay官方返回错误：`{"code":"error","msg":"pid错误，未找到对应商家"}`

## ✅ 启用真实支付

### 方法一：修改配置文件（推荐）

编辑 `src/config/paymentConfig.ts`：

```typescript
export const defaultPaymentConfig: PaymentConfig = {
  // 🔥 替换为您的真实Z-Pay商户信息
  zpayPid: 'your_real_zpay_pid',     // 您的真实商户ID
  zpayKey: 'your_real_zpay_key',     // 您的真实商户密钥
  
  // 应用配置
  appUrl: 'https://yourdomain.com',   // 生产环境域名
  siteName: '文字转小红书',
  
  // 🔥 启用真实支付
  isDemoMode: false,                  // 设置为 false
  enableDebugLog: true
};
```

### 方法二：使用环境变量

创建 `.env` 文件：

```env
# Z-Pay 商户配置
ZPAY_PID=your_real_zpay_pid
ZPAY_KEY=your_real_zpay_key

# 应用配置
VITE_APP_URL=https://yourdomain.com
VITE_SITE_NAME=文字转小红书

# 启用真实支付
ZPAY_DEMO_MODE=false
```

## 🔧 获取Z-Pay商户信息

1. **注册Z-Pay商户账号**
   - 访问 [Z-Pay官网](https://z-pay.cn)
   - 完成商户注册和认证

2. **获取商户信息**
   - 登录Z-Pay商户后台
   - 获取商户ID (`pid`)
   - 获取商户密钥 (`key`)

3. **配置回调地址**
   - 异步通知地址：`https://yourdomain.com/api/payment/zpay-webhook`
   - 跳转地址：`https://yourdomain.com/payment/success`

## 📊 支付流程

### 演示模式流程
1. 用户点击支付按钮
2. 系统生成演示支付参数
3. 显示"演示模式"提示
4. 不跳转到支付页面

### 真实支付流程
1. 用户点击支付按钮
2. 系统生成真实支付参数和签名
3. 跳转到Z-Pay支付页面
4. 用户完成支付
5. Z-Pay发送支付结果通知
6. 系统自动充值积分

## 🛠️ 技术细节

### 支持的支付方式
- **微信支付** (`wxpay`)
- **支付宝** (`alipay`)

### 签名算法
- 使用MD5签名
- 按照Z-Pay官方标准实现
- 参数按字典序排序

### 安全特性
- 签名验证防篡改
- 重复通知处理
- 金额校验
- 商户ID验证

## 🔍 调试和测试

### 查看支付配置
在浏览器控制台中运行：
```javascript
// 查看当前支付配置
console.log('支付配置信息');
```

### 测试支付流程
1. 确保应用运行在 `http://localhost:5173`
2. 点击积分购买页面的支付按钮
3. 查看控制台输出的调试信息

### 常见问题

**Q: 点击支付没有反应？**
A: 检查浏览器控制台是否有错误信息

**Q: 显示"pid错误，未找到对应商家"？**
A: 当前为演示模式，需要配置真实的商户信息

**Q: 如何验证签名算法？**
A: 运行 `node zpay-integration-example.js` 测试签名生成

## 📞 技术支持

如需帮助，请：
1. 检查控制台错误信息
2. 确认Z-Pay商户信息配置正确
3. 验证回调地址可访问性

---

**⚠️ 重要提醒**：
- 生产环境请使用HTTPS域名
- 妥善保管商户密钥
- 定期检查支付回调日志
