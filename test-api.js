// 测试API代理是否正常工作
import axios from 'axios';

async function testAPIProxy() {
  console.log('开始测试API代理配置...\n');
  
  // 测试Chat API代理
  console.log('1. 测试Chat API代理:');
  try {
    const chatResponse = await axios.post('http://localhost:5173/api/chat', {
      model: 'doubao-seed-1-6-flash-250828',
      messages: [
        {
          role: 'user',
          content: '你好，请回复OK'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    }, {
      headers: {
        'X-API-Key': 'f9772eba-6dd6-4154-adbf-b1e234a1b0ee',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Chat API代理正常工作');
    console.log('响应状态:', chatResponse.status);
  } catch (error) {
    console.log('❌ Chat API代理失败:', error.message);
  }
  
  console.log('\n2. 测试Images API代理:');
  try {
    const imagesResponse = await axios.post('http://localhost:5173/api/images', {
      prompt: '测试图片生成',
      model: 'doubao-seedream-3-0-t2i-250415',
      n: 1,
      size: '256x256',
      response_format: 'url'
    }, {
      headers: {
        'X-API-Key': 'f9772eba-6dd6-4154-adbf-b1e234a1b0ee',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Images API代理正常工作');
    console.log('响应状态:', imagesResponse.status);
  } catch (error) {
    console.log('❌ Images API代理失败:', error.message);
  }
  
  console.log('\n测试完成！');
}

// 运行测试
testAPIProxy().catch(console.error);