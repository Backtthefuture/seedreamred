export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只处理 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // 从查询参数获取图片 URL
    const { url } = req.query;
    
    if (!url) {
      console.error('Missing URL parameter in request');
      res.status(400).json({ error: 'Missing URL parameter' });
      return;
    }
    
    // 解码URL（因为前端使用了encodeURIComponent）
    const decodedUrl = decodeURIComponent(url);
    console.log('Proxying TOS image:', decodedUrl);
    
    // 验证 URL 是否为豆包 TOS 服务器
    const validHost = 'ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com';
    let urlObj;
    
    try {
      urlObj = new URL(decodedUrl);
    } catch (error) {
      console.error('Invalid URL format:', decodedUrl);
      res.status(400).json({ 
        error: 'Invalid URL format',
        message: 'The provided URL is not valid' 
      });
      return;
    }
    
    if (urlObj.host !== validHost) {
      console.error('Invalid host:', urlObj.host, 'Expected:', validHost);
      res.status(403).json({ 
        error: 'Invalid URL',
        message: 'Only Doubao TOS image URLs are allowed' 
      });
      return;
    }
    
    // 请求图片
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(30000) // 30秒超时
    });
    
    // 检查响应状态
    if (!response.ok) {
      console.error('TOS fetch error:', response.status, response.statusText);
      res.status(response.status).json({ 
        error: 'Failed to fetch image',
        status: response.status,
        statusText: response.statusText
      });
      return;
    }
    
    // 获取图片内容类型
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时
    
    // 将图片流式传输给客户端
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('TOS proxy error:', error);
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      res.status(504).json({ 
        error: 'Request timeout',
        message: '图片获取超时' 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}