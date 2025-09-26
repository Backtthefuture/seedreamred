// 简单的调试脚本
console.log('=== 应用调试信息 ===');
console.log('当前时间:', new Date().toISOString());
console.log('用户代理:', navigator.userAgent);
console.log('页面URL:', window.location.href);

// 检查 DOM
console.log('HTML根元素:', document.documentElement);
console.log('Body元素:', document.body);
console.log('Root元素:', document.getElementById('root'));

// 检查环境变量
console.log('环境变量:');
console.log('- NODE_ENV:', import.meta.env.NODE_ENV);
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置');

// 检查是否有JavaScript错误
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});

console.log('=== 调试脚本加载完成 ===');
