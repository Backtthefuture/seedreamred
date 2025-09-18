// v1.6.1: 简单的内存缓存速率限制器（适用于Serverless）
const rateLimitCache = new Map();

// 获取客户端IP地址
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

// 速率限制检查
function checkRateLimit(ip) {
  const now = Date.now();
  const minuteKey = `${ip}_${Math.floor(now / 60000)}`; // 每分钟
  const dayKey = `${ip}_${Math.floor(now / 86400000)}`; // 每天
  
  // 清理过期缓存（保留最近2分钟和2天的记录）
  const cutoffMinute = Math.floor(now / 60000) - 2;
  const cutoffDay = Math.floor(now / 86400000) - 2;
  
  for (const [key] of rateLimitCache) {
    if (key.includes('_') && (
      (key.includes(`_${cutoffMinute}`) && key !== dayKey) ||
      (key.includes(`_${cutoffDay}`) && !key.includes(Math.floor(now / 60000).toString()))
    )) {
      rateLimitCache.delete(key);
    }
  }
  
  // 检查每分钟限制（10次）
  const minuteCount = rateLimitCache.get(minuteKey) || 0;
  if (minuteCount >= 10) {
    return { allowed: false, type: 'minute', limit: 10, remaining: 0 };
  }
  
  // 检查每日限制（100次）
  const dayCount = rateLimitCache.get(dayKey) || 0;
  if (dayCount >= 100) {
    return { allowed: false, type: 'day', limit: 100, remaining: 0 };
  }
  
  // 更新计数
  rateLimitCache.set(minuteKey, minuteCount + 1);
  rateLimitCache.set(dayKey, dayCount + 1);
  
  return { 
    allowed: true, 
    minuteRemaining: 10 - (minuteCount + 1),
    dayRemaining: 100 - (dayCount + 1)
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
    // v1.6.1: AI智能拆分保护措施
    const clientIP = getClientIP(req);
    const userApiKey = req.headers['x-api-key'];
    
    // 如果用户提供了API Key，直接使用（不受限制）
    if (!userApiKey) {
      // 使用免费服务，需要检查速率限制
      const rateCheck = checkRateLimit(clientIP);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: '请求过于频繁',
          message: rateCheck.type === 'minute' 
            ? '每分钟最多10次请求，请稍后再试' 
            : '每日免费额度已用完，请明天再试或使用自己的API密钥',
          type: 'RATE_LIMIT_EXCEEDED',
          limit: rateCheck.limit,
          retryAfter: rateCheck.type === 'minute' ? 60 : 86400
        });
      }
      
      // 检查请求大小（免费用户限制更严格）
      const requestBody = JSON.stringify(req.body);
      if (requestBody.length > 8192) { // 8KB限制
        return res.status(413).json({
          error: '请求内容过大',
          message: '免费用户单次请求最大8KB，请缩短文本或使用自己的API密钥',
          type: 'PAYLOAD_TOO_LARGE',
          maxSize: 8192,
          currentSize: requestBody.length
        });
      }
      
      // 在响应头中添加剩余配额信息
      res.setHeader('X-RateLimit-Remaining-Minute', rateCheck.minuteRemaining);
      res.setHeader('X-RateLimit-Remaining-Day', rateCheck.dayRemaining);
    }
    
    // 获取API密钥：优先用户提供的，其次服务端的（免费额度）
    const apiKey = userApiKey || process.env.DOUBAO_API_KEY;
    
    if (!apiKey) {
      res.status(401).json({ 
        error: 'API密钥未配置',
        message: '服务暂时不可用，请稍后重试或在设置中配置您的API密钥',
        type: 'API_KEY_UNAVAILABLE'
      });
      return;
    }
    
    // 构建请求到豆包 API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 检查响应状态
    if (!response.ok) {
      console.error('Doubao API error:', data);
      res.status(response.status).json(data);
      return;
    }
    
    // 返回成功响应
    res.status(200).json(data);
  } catch (error) {
    console.error('Chat proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}