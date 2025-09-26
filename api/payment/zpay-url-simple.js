// 简化版支付URL生成接口（不依赖Supabase）
import crypto from 'crypto';

// Z-Pay 签名算法（按照官方Node.js示例实现）
function getVerifyParams(params) {
  var sPara = [];
  if (!params) return null;
  
  for (var key in params) {
    if ((!params[key]) || key == "sign" || key == "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
  // 参数进行排序
  sPara = sPara.sort();
  
  var prestr = '';
  for (var i2 = 0; i2 < sPara.length; i2++) {
    var obj = sPara[i2];
    if (i2 == sPara.length - 1) {
      prestr = prestr + obj[0] + '=' + obj[1] + '';
    } else {
      prestr = prestr + obj[0] + '=' + obj[1] + '&';
    }
  }
  return prestr;
}

// 生成MD5签名
function generateSign(paramString, key) {
  const signString = paramString + key;
  return crypto.createHash('md5').update(signString, 'utf8').digest('hex');
}

// 生成唯一订单号
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORDER${timestamp}${random}`;
}

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
    console.log('收到支付请求:', req.body);
    
    // 获取请求参数
    const { product_name, amount, credits, payment_type = 'wxpay' } = req.body;
    
    // 验证必需参数
    if (!product_name || !amount || !credits) {
      res.status(400).json({ 
        error: '缺少必需参数',
        message: '请提供 product_name, amount 和 credits' 
      });
      return;
    }
    
    // 生成订单号
    const outTradeNo = generateOrderNo();
    
    console.log('生成订单号:', outTradeNo);
    
    // 构建Z-Pay支付参数（按照官方Node.js示例）
    const zpayParams = {
      pid: process.env.ZPAY_PID || 'demo_pid',
      money: parseFloat(amount).toFixed(2), // 确保最多保留两位小数
      name: product_name,
      notify_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/api/payment/zpay-webhook`,
      out_trade_no: outTradeNo,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/success`,
      sitename: process.env.VITE_SITE_NAME || '文字转小红书', // 网站名称
      type: payment_type // 微信支付：wxpay，支付宝：alipay
    };
    
    // 添加附加内容（可选）
    zpayParams.param = `积分充值-${credits}积分`;
    
    console.log('支付参数:', zpayParams);
    
    // 生成签名
    const paramString = getVerifyParams(zpayParams);
    const sign = generateSign(paramString, process.env.ZPAY_KEY || 'demo_key');
    
    console.log('参数字符串:', paramString);
    console.log('生成签名:', sign);
    
    // 添加签名到参数中
    zpayParams.sign = sign;
    zpayParams.sign_type = 'MD5';
    
    // 构建完整的支付URL（使用官方域名）
    const zpayBaseUrl = 'https://z-pay.cn/submit.php';
    const urlParams = new URLSearchParams(zpayParams).toString();
    const paymentUrl = `${zpayBaseUrl}?${urlParams}`;
    
    console.log('生成支付URL:', paymentUrl);
    
    // 返回支付链接和表单数据
    res.status(200).json({
      success: true,
      payment_url: paymentUrl, // GET方式的完整URL
      form_data: zpayParams, // POST表单数据
      form_action: 'https://z-pay.cn/submit.php', // POST表单提交地址
      out_trade_no: outTradeNo,
      method: 'POST', // 推荐使用POST方法
      debug_info: {
        param_string: paramString,
        sign: sign,
        env_vars: {
          ZPAY_PID: process.env.ZPAY_PID ? '已设置' : '未设置',
          ZPAY_KEY: process.env.ZPAY_KEY ? '已设置' : '未设置',
          VITE_APP_URL: process.env.VITE_APP_URL || 'http://localhost:5173'
        }
      }
    });
    
  } catch (error) {
    console.error('支付URL生成错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
