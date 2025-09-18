// 测试AI模型兼容性脚本
import axios from 'axios';

// 豆包API配置
const API_KEY = 'f9772eba-6dd6-4154-adbf-b1e234a1b0ee';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 要测试的模型列表
const MODELS = [
  { id: 'doubao-seed-1-6-flash-250828', name: '豆包Flash' },
  { id: 'doubao-seed-1-6-thinking-250715', name: '豆包Thinking' },
  { id: 'kimi-k2-250711', name: 'Kimi K2' }
];

// 测试文本
const TEST_TEXT = `今天去了一家超级棒的咖啡店，环境特别温馨，咖啡香味扑鼻。
店里有很多绿植装饰，阳光透过窗户洒进来，特别有氛围。
点了一杯拿铁和一份提拉米苏，味道都很不错。
最重要的是这里很安静，特别适合看书或者工作。
下次还会再来的！`;

// 测试单个模型
async function testModel(modelId, modelName) {
  console.log(`\n测试模型: ${modelName} (${modelId})`);
  console.log('='.repeat(50));
  
  const prompt = `你是一个小红书内容专家，请将以下文本拆分为小红书笔记格式。
  
要求：
1. 提取一个吸引眼球的封面标题（20-50字）
2. 将内容拆分为3-8个段落，每段50-200字
3. 返回JSON格式：{"cover": "标题", "contents": ["段落1", "段落2"]}

待拆分文本：
${TEST_TEXT}`;

  try {
    const response = await axios.post(API_URL, {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 30000
    });

    if (response.data?.choices?.[0]?.message?.content) {
      const content = response.data.choices[0].message.content;
      console.log('✅ 模型响应成功');
      
      // 尝试解析JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log('📌 封面标题:', result.cover);
          console.log('📄 内容段落数:', result.contents.length);
          console.log('📝 第一段内容预览:', result.contents[0].substring(0, 50) + '...');
        }
      } catch (parseError) {
        console.log('⚠️ JSON解析失败，但模型响应正常');
        console.log('原始响应:', content.substring(0, 200) + '...');
      }
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('💡 可能原因: 模型ID不正确或未授权');
    }
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试所有AI模型...');
  console.log('API地址:', API_URL);
  console.log('测试文本长度:', TEST_TEXT.length, '字');
  
  for (const model of MODELS) {
    await testModel(model.id, model.name);
    // 等待1秒，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('测试完成！');
}

// 执行测试
runTests().catch(console.error);