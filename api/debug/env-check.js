// 检查环境变量的调试接口
export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const envCheck = {
      // 检查Supabase配置
      supabase: {
        url: process.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
        url_preview: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 30) + '...' : 'not set',
        service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
        service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0
      },
      
      // 检查Z-Pay配置
      zpay: {
        pid: process.env.ZPAY_PID || 'missing',
        key: process.env.ZPAY_KEY ? 'configured' : 'missing',
        key_length: process.env.ZPAY_KEY ? process.env.ZPAY_KEY.length : 0
      },
      
      // 检查应用配置
      app: {
        url: process.env.VITE_APP_URL || 'missing',
        site_name: process.env.VITE_SITE_NAME || 'missing',
        demo_mode: process.env.ZPAY_DEMO_MODE || 'missing'
      },
      
      // 检查API Key
      api: {
        doubao_key: process.env.VITE_DOUBAO_API_KEY ? 'configured' : 'missing'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Environment variables check',
      data: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Environment check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
