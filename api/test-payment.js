// 测试支付API接口
export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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
    console.log('收到测试请求:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });
    
    // 返回测试响应
    res.status(200).json({
      success: true,
      message: '测试API正常工作',
      received_data: req.body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('测试API错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message,
      stack: error.stack
    });
  }
}
