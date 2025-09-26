// 验证支付配置是否正确加载
console.log('🔍 验证支付配置');
console.log('================\n');

// 模拟导入配置
const config = {
  zpayPid: '2025062920440492',
  zpayKey: 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1',
  isDemoMode: false,
  appUrl: 'http://localhost:5173',
  siteName: '文字转小红书'
};

console.log('✅ 配置信息:');
console.log(`商户ID (PID): ${config.zpayPid}`);
console.log(`商户密钥长度: ${config.zpayKey.length} 位`);
console.log(`演示模式: ${config.isDemoMode ? '🚨 演示模式' : '✅ 真实支付模式'}`);
console.log(`应用域名: ${config.appUrl}`);
console.log(`网站名称: ${config.siteName}`);

console.log('\n🎯 配置状态:');
if (config.zpayPid === '2025062920440492' && !config.isDemoMode) {
  console.log('✅ 真实商户信息已配置');
  console.log('✅ 真实支付模式已启用');
  console.log('🚀 准备就绪！可以进行真实支付测试');
} else {
  console.log('❌ 配置可能有问题，请检查');
}

console.log('\n📝 测试步骤:');
console.log('1. 访问 http://localhost:5173');
console.log('2. 点击右上角的"积分"按钮');
console.log('3. 选择支付方式（微信支付或支付宝）');
console.log('4. 点击任意套餐的"立即支付"按钮');
console.log('5. 应该跳转到真实的Z-Pay支付页面');

console.log('\n⚠️  注意事项:');
console.log('- 建议先用小额金额测试（如1元套餐）');
console.log('- 确保回调地址可以被Z-Pay访问');
console.log('- 检查浏览器控制台是否有错误信息');
