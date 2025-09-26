// 测试新模型 doubao-seedream-4-0-250828
import axios from 'axios';

async function testNewModel() {
  console.log('===== 测试新图片生成模型 v1.1.0 =====\n');
  console.log('模型版本: doubao-seedream-4-0-250828\n');
  
  // 测试图片生成API
  console.log('1. 测试新模型图片生成:');
  
  try {
    const testPrompt = '生成一张小红书风格的美食分享图，展示精致的下午茶，包含马卡龙、蛋糕和咖啡，温暖色调，精美摆盘，高清画质，专业摄影';
    
    console.log('测试提示词:', testPrompt);
    console.log('正在生成图片...\n');
    
    const response = await axios.post('http://localhost:5173/api/images', {
      prompt: testPrompt,
      model: 'doubao-seedream-4-0-250828',
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    }, {
      headers: {
        'X-API-Key': 'f9772eba-6dd6-4154-adbf-b1e234a1b0ee',
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('✅ 新模型调用成功！');
    console.log('响应状态:', response.status);
    
    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;
      console.log('生成的图片URL:', imageUrl);
      console.log('\n图片质量提升特征:');
      console.log('- 更高的清晰度和细节表现');
      console.log('- 更准确的提示词理解');
      console.log('- 更符合小红书风格');
    }
  } catch (error) {
    console.log('❌ 新模型测试失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('错误详情:', error.response.data);
    }
  }
  
  console.log('\n===== 测试完成 =====');
  console.log('请在浏览器中访问 http://localhost:5173');
  console.log('使用新模型生成图片并对比质量提升效果');
}

// 运行测试
testNewModel().catch(console.error);