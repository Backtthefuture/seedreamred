// 测试TOS代理是否正常工作
import axios from 'axios';

async function testTOSProxy() {
  console.log('开始测试TOS代理配置...\n');
  
  // 测试TOS图片代理
  console.log('1. 测试TOS图片代理:');
  
  // 使用一个已知的TOS URL格式进行测试
  const testPath = '/doufu_NzZXRzL3dhdGVyZy9iYmFFyay5wbmc_eCl0b3MtcHJvY2Vzcy1pbWFnZS9yZXNpemUsdy1yNzUwLGgtNzUwJngtdG9zLXByb2Nlc3M9ZWRpc.png';
  const proxyUrl = `http://localhost:5173/proxy/tos${testPath}`;
  
  try {
    console.log('代理URL:', proxyUrl);
    const response = await axios.get(proxyUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log('✅ TOS代理正常工作');
    console.log('响应状态:', response.status);
    console.log('内容类型:', response.headers['content-type']);
    console.log('内容大小:', response.data.length, 'bytes');
  } catch (error) {
    console.log('❌ TOS代理失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data?.toString()?.substring(0, 200));
    }
  }
  
  console.log('\n2. 测试URL转换逻辑:');
  const tosUrl = 'https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/doufu_test.png?x-tos-process=image';
  const expectedProxyUrl = '/proxy/tos/doufu_test.png?x-tos-process=image';
  console.log('原始URL:', tosUrl);
  console.log('期望代理URL:', expectedProxyUrl);
  
  console.log('\n测试完成！');
  console.log('请在浏览器中访问 http://localhost:5173 并尝试生成和下载图片。');
}

// 运行测试
testTOSProxy().catch(console.error);