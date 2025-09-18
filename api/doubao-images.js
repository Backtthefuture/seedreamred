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
    // 图片生成功能需要用户提供自己的API密钥（v1.6.1安全优化）
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      res.status(401).json({ 
        error: '需要API密钥',
        message: '图片生成功能需要您提供豆包API密钥。AI拆分功能仍可免费使用。',
        type: 'API_KEY_REQUIRED',
        guide: '请在设置中配置您的豆包API密钥，或查看API密钥申请教程'
      });
      return;
    }
    
    // 构建请求到豆包图片生成 API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body),
      // 图片生成可能需要更长时间
      signal: AbortSignal.timeout(60000) // 60秒超时
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 检查响应状态
    if (!response.ok) {
      console.error('Doubao Images API error:', data);
      
      // 处理特定错误码
      if (response.status === 401) {
        res.status(401).json({ 
          error: 'API密钥无效或已过期',
          originalError: data 
        });
        return;
      } else if (response.status === 429) {
        res.status(429).json({ 
          error: '请求过于频繁，请稍后再试',
          originalError: data 
        });
        return;
      }
      
      res.status(response.status).json(data);
      return;
    }
    
    // 返回成功响应
    res.status(200).json(data);
  } catch (error) {
    console.error('Images proxy error:', error);
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      res.status(504).json({ 
        error: 'Request timeout',
        message: '图片生成超时，请重试' 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}