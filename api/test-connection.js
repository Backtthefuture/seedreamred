// 测试API连接专用端点
// v1.6.1: 专门用于验证API密钥有效性，不涉及实际业务功能

// 简单的频率限制缓存
const testRateLimitCache = new Map();

// 获取客户端IP地址
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

// 测试连接的速率限制检查（更严格，防止滥用）
function checkTestRateLimit(ip) {
  const now = Date.now();
  const minuteKey = `${ip}_${Math.floor(now / 60000)}`; // 每分钟
  
  // 清理过期缓存
  const cutoffMinute = Math.floor(now / 60000) - 2;
  for (const [key] of testRateLimitCache) {
    if (key.includes('_') && key.includes(`_${cutoffMinute}`)) {
      testRateLimitCache.delete(key);
    }
  }
  
  // 检查每分钟限制（5次测试连接）
  const minuteCount = testRateLimitCache.get(minuteKey) || 0;
  if (minuteCount >= 5) {
    return { 
      allowed: false, 
      type: 'minute', 
      limit: 5, 
      remaining: 0,
      retryAfter: 60 - (now % 60000) / 1000
    };
  }
  
  // 更新计数
  testRateLimitCache.set(minuteKey, minuteCount + 1);
  
  return { 
    allowed: true, 
    remaining: 5 - (minuteCount + 1)
  };
}

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
  );
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只处理 POST 请求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const clientIP = getClientIP(req);
    
    // 检查测试连接频率限制
    const rateCheck = checkTestRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: '测试连接请求过于频繁',
        message: '每分钟最多5次测试连接请求',
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(rateCheck.retryAfter)
      });
    }
    
    // 获取API密钥
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API密钥缺失',
        message: '请提供API密钥进行测试',
        type: 'API_KEY_MISSING'
      });
    }
    
    // 基本格式验证
    if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'API密钥格式错误',
        message: 'API密钥长度不足或格式不正确',
        type: 'API_KEY_FORMAT_ERROR'
      });
    }
    
    // 测试AI聊天API
    const testChatResult = await testChatAPI(apiKey);
    if (!testChatResult.success) {
      return res.status(testChatResult.status || 401).json({
        success: false,
        error: testChatResult.error,
        message: testChatResult.message,
        type: testChatResult.type
      });
    }
    
    // 测试图片生成API（可选，如果第一个成功再测试）
    const testImageResult = await testImageAPI(apiKey);
    
    // 返回测试结果
    res.status(200).json({
      success: true,
      message: '连接测试成功',
      capabilities: {
        chat: testChatResult.success,
        imageGeneration: testImageResult.success
      },
      remaining: rateCheck.remaining,
      details: {
        chatAPI: testChatResult.message || '可用',
        imageAPI: testImageResult.message || (testImageResult.success ? '可用' : '不可用')
      }
    });
    
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: '内部服务器错误',
      message: '连接测试失败，请稍后再试',
      type: 'INTERNAL_ERROR'
    });
  }
}

// 测试聊天API
async function testChatAPI(apiKey) {
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'ep-20241022155536-2x8zw', // 使用默认模型
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        max_tokens: 10, // 最小token数，减少消耗
        temperature: 0
      }),
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Chat API test failed:', data);
      
      if (response.status === 401) {
        return {
          success: false,
          status: 401,
          error: 'API密钥无效或已过期',
          message: 'API密钥验证失败，请检查密钥是否正确',
          type: 'API_KEY_INVALID'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          status: 429,
          error: '请求频率限制',
          message: 'API调用频率过高，请稍后再试',
          type: 'RATE_LIMIT'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          status: 403,
          error: 'API权限不足',
          message: 'API密钥权限不足，请检查账户状态',
          type: 'PERMISSION_DENIED'
        };
      }
      
      return {
        success: false,
        status: response.status,
        error: '聊天API测试失败',
        message: data.error?.message || '未知错误',
        type: 'API_ERROR'
      };
    }
    
    // 检查响应格式
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return {
        success: true,
        message: '聊天API可用'
      };
    } else {
      return {
        success: false,
        error: '响应格式错误',
        message: '聊天API响应格式异常',
        type: 'RESPONSE_FORMAT_ERROR'
      };
    }
    
  } catch (error) {
    console.error('Chat API test error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 408,
        error: '请求超时',
        message: '连接豆包API超时，请检查网络连接',
        type: 'TIMEOUT'
      };
    }
    
    return {
      success: false,
      status: 500,
      error: '网络错误',
      message: '无法连接到豆包API服务器',
      type: 'NETWORK_ERROR'
    };
  }
}

// 测试图片生成API
async function testImageAPI(apiKey) {
  try {
    // 这里只做一个轻量级的检查，不实际生成图片
    // 可以通过发送一个无效的小请求来验证权限
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: 'test',
        model: 'doubao-xl',
        n: 1,
        size: '256x256', // 最小尺寸
        response_format: 'url'
      }),
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    // 对于图片API，我们只检查是否有权限，不关心具体结果
    if (response.status === 401) {
      return {
        success: false,
        message: '图片API无权限'
      };
    } else if (response.status === 403) {
      return {
        success: false,
        message: '图片API权限不足'
      };
    } else {
      return {
        success: true,
        message: '图片API可用'
      };
    }
    
  } catch (error) {
    console.error('Image API test error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: '图片API连接超时'
      };
    }
    
    return {
      success: false,
      message: '图片API网络错误'
    };
  }
}